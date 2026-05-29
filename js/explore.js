// API 상수 관리
const API_URL = window.API_BASE_URL;

let currentFilters = {
    regions: [],
    categories: [],
    status: ""
};

let activeModalType = "";
let tempSelectedItems = [];

// 서울 전체 선택 시 하위 필터링에 매핑될 세부 지역 리스트
const SEOUL_SUB_REGIONS = ["강남/서초", "성수", "여의도", "용산", "잠실", "홍대/신촌"];

document.addEventListener("DOMContentLoaded", () => {
    // 홈 화면 카테고리 연동 파라미터 수신
    const urlParams = new URLSearchParams(window.location.search);
    const paramCategory = urlParams.get("category"); // 주소창에서 category 키값 추출

    if (paramCategory) {
        // categories 배열에 홈에서 누른 카테고리 명을 강제 주입
        currentFilters.categories = [paramCategory];

        // 상단 카테고리 메인 칩을 찾아 활성화 스타일을 입히고 카테고리 1로 텍스트를 바꿈
        const categoryMainChip = document.getElementById("chip-category");
        if (categoryMainChip) {
            categoryMainChip.textContent = `카테고리 1`;
            categoryMainChip.classList.add("active");
        }
    }

    // 최초 전체 로드
    fetchFilteredPopups();

    // 상단 3개 필터 메인 칩 클릭 이벤트 바인딩
    document.querySelectorAll(".filter-chip").forEach(chip => {
        chip.addEventListener("click", () => {
            const modalType = chip.getAttribute("data-type");
            openFilterModal(modalType);
        });
    });

    // 모달 액션 버튼 바인딩
    document.getElementById("modal-close-x").addEventListener("click", closeModal);
    document.getElementById("modal-btn-reset").addEventListener("click", resetTempFilters);
    document.getElementById("modal-btn-apply").addEventListener("click", applyFilterChanges);

    // 정렬 드롭다운 변경 시 즉시 재필터링 리렌더링
    document.getElementById("popup-sort-select").addEventListener("change", () => {
        fetchFilteredPopups();
    });

    // 모달 바깥 클릭 시 닫기
    document.getElementById("filter-modal").addEventListener("click", (e) => {
        if (e.target.id === "filter-modal") closeModal();
    });
});

// 서버 통신 및 다중 필터링
async function fetchFilteredPopups() {
    const gridContainer = document.getElementById("explore-grid-container");
    if (!gridContainer) return;

    const sortType = document.getElementById("popup-sort-select").value;

    // API 쿼리 스트링 조립
    let queryString = `?sort=${sortType}`;
    if (currentFilters.status) queryString += `&status=${currentFilters.status}`;
    if (currentFilters.regions.length > 0) queryString += `&regions=${encodeURIComponent(currentFilters.regions.join(","))}`;
    if (currentFilters.categories.length > 0) queryString += `&categories=${encodeURIComponent(currentFilters.categories.join(","))}`;

    // 찜 유저 식별용 쿼리 결합
    queryString += getUserQuery();

    try {
        gridContainer.innerHTML = `<p class="loading-msg">팝업 스토어를 필터링 중입니다...</p>`;

        const response = await fetch(`${API_URL}/popups${queryString}`);
        if (!response.ok) throw new Error(`조회 실패`);

        let popupsData = await response.json();

        popupsData = popupsData.filter(popup => {
            // 운영 상태 필터 체크
            if (currentFilters.status && popup.status !== currentFilters.status) {
                return false;
            }

            // 지역 필터 조건문
            if (currentFilters.regions.length > 0) {
                const hasSeoulAll = currentFilters.regions.includes("서울 전체");

                if (hasSeoulAll) {
                    // "서울 전체"가 켜져 있으면, 하위 6개 지역 중 하나이거나 "서울 전체" 텍스트 그대로일 때 통과
                    const isSeoulPopup = SEOUL_SUB_REGIONS.includes(popup.regionName) || popup.regionName === "서울 전체";
                    // 다른 지역(부산, 대구 등)도 중복 선택했을 수 있으므로 예외 처리 인정
                    const isOtherSelectedRegion = currentFilters.regions.includes(popup.regionName);

                    if (!isSeoulPopup && !isOtherSelectedRegion) return false;
                } else {
                    // 서울 전체가 선택되지 않았다면 선택한 지역 명과 일치해야 함
                    if (!currentFilters.regions.includes(popup.regionName)) return false;
                }
            }

            // 카테고리 필터 체크
            if (currentFilters.categories.length > 0 && !currentFilters.categories.includes(popup.categoryName)) {
                return false;
            }
            return true;
        });

        // 정렬 보정
        const now = new Date(); // 현재 실시간 날짜/시간 획득

        if (sortType === "latest") {
            // 최신등록순-고유 ID가 큰 순서대로
            popupsData.sort((a, b) => b.id - a.id);

        } else if (sortType === "rating") {
            // 별점 높은순-평점 큰 순서대로
            popupsData.sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0));

        } else if (sortType === "closeSoon") {
            // 종료 임박순
            popupsData.sort((a, b) => {
                const dateA = new Date(a.endDate);
                const dateB = new Date(b.endDate);

                const timeDiffA = dateA - now; // 종료일까지 남은 밀리초
                const timeDiffB = dateB - now;

                // 이미 종료된 팝업(timeDiff < 0)은 맨 뒤로 밀어내기
                if (timeDiffA < 0 && timeDiffB >= 0) return 1;
                if (timeDiffB < 0 && timeDiffA >= 0) return -1;

                // 아직 운영 중인 것들끼리는 남은 시간이 적은 순으로 정렬
                return timeDiffA - timeDiffB;
            });
        }

        gridContainer.innerHTML = "";

        if (popupsData.length === 0) {
            gridContainer.innerHTML = `<p class="no-data-msg">선택하신 조건에 맞는 팝업 스토어가 없습니다.</p>`;
            return;
        }

        // 최종 필터링 데이터 화면 렌더링
        popupsData.forEach(popup => {
            const activeClass = popup.isWishlisted ? "active" : "";
            const formattedStartDate = formatDateString(popup.startDate);
            const formattedEndDate = formatDateString(popup.endDate);

            let statusBadgeHtml = "";
            if (popup.status === "ongoing") {
                statusBadgeHtml = `<span class="card-status is-running" style="margin-bottom: 4px; display: inline-block;">운영중</span>`;
            } else if (popup.status === "upcoming") {
                statusBadgeHtml = `<span class="card-status is-upcoming" style="margin-bottom: 4px; display: inline-block;">오픈예정</span>`;
            } else {
                statusBadgeHtml = `<span class="card-status is-closed" style="margin-bottom: 4px; display: inline-block;">종료</span>`;
            }

            // 평균 별점
            let starsHtml = "";
            const score = Math.round(popup.avgRating || 0); // 정수로 반올림

            for (let i = 1; i <= 5; i++) {
                starsHtml += i <= score
                    ? `<img src="/assets/images/icons/icon-star-fill.png" alt="별" style="width:14px; height:14px; object-fit:contain;">`
                    : `<img src="/assets/images/icons/icon-star-empty.png" alt="빈 별" style="width:14px; height:14px; object-fit:contain;">`;
            }

            const cardHtml = `
                <div class="popup-card leisure-card" data-popup-id="${popup.id}">
                    <div class="card-image-wrap" onclick="location.href='/pages/detail.html?id=${popup.id}'" style="cursor:pointer;">
                        <img src="${popup.mainImageUrl}" alt="${popup.title} 썸네일" class="card-thumb" />
                    </div>
                    <button class="wish-btn ${activeClass}" aria-label="찜하기" onclick="toggleWish(${popup.id}, this)">
                        <span class="heart-icon"></span> 찜하기
                    </button>
                    <div class="card-body-wrap">
                        <div class="card-info">
                            ${statusBadgeHtml}
                            <h3 class="card-title" onclick="location.href='/pages/detail.html?id=${popup.id}'" style="cursor:pointer;">${popup.title}</h3>
                            <p class="card-location">${popup.regionName}</p>
                            <p class="card-date">${formattedStartDate} - ${formattedEndDate}</p>
                            
                            <div class="rating-wrap" style="display:flex; align-items:center; gap:4px; margin: 4px 0 6px 0; font-size:14px;">
                                <div class="rating-stars" style="display:flex; gap:2px;">${starsHtml}</div>
                                <span class="rating-num" style="font-weight:var(--weight-semibold); color:var(--color-primary-dark); margin-left:4px;">${(popup.avgRating || 0).toFixed(1)}</span>
                                <span class="rating-max" style="color:var(--color-text-secondary);">/ 5.0</span>
                            </div>

                            <span class="card-category">${popup.categoryName}</span>
                        </div>
                    </div>
                </div>
            `;
            gridContainer.insertAdjacentHTML("beforeend", cardHtml);
        });

    } catch (error) {
        console.error("그리드 목록 필터 연동 실패:", error);
        gridContainer.innerHTML = `<p class="error-msg">정보를 불러오는 도중 오류가 발생했습니다.</p>`;
    }
}

// 필터 모달 오픈 및 세부 타입 정의
async function openFilterModal(type) {
    activeModalType = type;
    const modal = document.getElementById("filter-modal");
    const modalTitle = document.getElementById("modal-title-text");
    const chipGrid = document.getElementById("modal-chip-grid");

    if (!modal || !chipGrid) return;

    chipGrid.innerHTML = `<p style="font-size:13px; color:#888;">목록을 가져오는 중...</p>`;
    modal.classList.add("show");

    if (type === "region") {
        modalTitle.textContent = "지역 선택";
        tempSelectedItems = [...currentFilters.regions];
        await loadModalSubChips(`${API_URL}/regions`, "regionName");
    } else if (type === "category") {
        modalTitle.textContent = "카테고리 선택";
        tempSelectedItems = [...currentFilters.categories];
        await loadModalSubChips(`${API_URL}/categories`, "categoryName");
    } else if (type === "status") {
        modalTitle.textContent = "운영 상태 선택";
        tempSelectedItems = currentFilters.status ? [currentFilters.status] : [];
        renderStatusChips();
    }
}

// 서버에서 데이터를 받아와 모달 내부에 하위 조약돌 칩으로 매핑
async function loadModalSubChips(apiUrl, jsonKeyName) {
    const chipGrid = document.getElementById("modal-chip-grid");
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error("마스터 데이터 조회 실패");
        const data = await response.json();

        chipGrid.innerHTML = "";

        data.forEach(item => {
            const chipValue = item[jsonKeyName];

            const isSelected = tempSelectedItems.includes(chipValue);
            const activeClass = isSelected ? "active" : "";

            const button = document.createElement("button");
            button.className = `sub-chip ${activeClass}`;
            button.textContent = chipValue;
            button.dataset.value = chipValue;

            button.onclick = () => toggleSubChipSelection(chipValue, button);
            chipGrid.appendChild(button);
        });
    } catch (error) {
        console.error("마스터 데이터 파싱 에러:", error);
        chipGrid.innerHTML = `<p style="font-size:13px; color:red;">목록을 가져오지 못했습니다.</p>`;
    }
}

// 운영 상태 칩 생성
function renderStatusChips() {
    const chipGrid = document.getElementById("modal-chip-grid");
    chipGrid.innerHTML = "";

    const statuses = [
        { id: "ongoing", name: "운영중" },
        { id: "upcoming", name: "오픈 예정" },
        { id: "closed", name: "운영 마감" }
    ];

    statuses.forEach(item => {
        const isSelected = tempSelectedItems.includes(item.id);
        const activeClass = isSelected ? "active" : "";

        const button = document.createElement("button");
        button.className = `sub-chip ${activeClass}`;
        button.textContent = item.name;
        button.dataset.value = item.id;

        button.onclick = () => toggleSubChipSelection(item.id, button);
        chipGrid.appendChild(button);
    });
}

// 모달 내부 조약돌 다중/단일 선택 토글 처리
function toggleSubChipSelection(value, element) {
    if (activeModalType === "status") {
        tempSelectedItems = tempSelectedItems.includes(value) ? [] : [value];
        document.querySelectorAll("#modal-chip-grid .sub-chip").forEach(btn => btn.classList.remove("active"));
        if (tempSelectedItems.length > 0) element.classList.add("active");
        return;
    }

    if (tempSelectedItems.includes(value)) {
        tempSelectedItems = tempSelectedItems.filter(item => item !== value);
        element.classList.remove("active");
    } else {
        tempSelectedItems.push(value);
        element.classList.add("active");
    }
}

// 적용하기 버튼 클릭 시 필터 상태 반영
function applyFilterChanges() {
    const mainChip = document.getElementById(`chip-${activeModalType}`);

    if (activeModalType === "region") {
        currentFilters.regions = [...tempSelectedItems];
        // 지역 칩 텍스트 업데이트
        if (currentFilters.regions.length > 0) {
            mainChip.textContent = `지역 ${currentFilters.regions.length}`;
            mainChip.classList.add("active");
        } else {
            mainChip.textContent = "지역";
            mainChip.classList.remove("active");
        }

    } else if (activeModalType === "category") {
        currentFilters.categories = [...tempSelectedItems];
        // 카테고리 칩 텍스트 업데이트
        if (currentFilters.categories.length > 0) {
            mainChip.textContent = `카테고리 ${currentFilters.categories.length}`;
            mainChip.classList.add("active");
        } else {
            mainChip.textContent = "카테고리";
            mainChip.classList.remove("active");
        }

    } else if (activeModalType === "status") {
        currentFilters.status = tempSelectedItems.length > 0 ? tempSelectedItems[0] : "";
        // 운영 상태는 단일 선택이므로 갯수 대신 켜고 끄기만 제어
        if (currentFilters.status) {
            if (currentFilters.status === "ongoing") {
                mainChip.textContent = "운영중";
            } else if (currentFilters.status === "upcoming") {
                mainChip.textContent = "오픈예정";
            } else if (currentFilters.status === "closed") {
                mainChip.textContent = "운영마감";
            }
            mainChip.classList.add("active");
        } else {
            mainChip.textContent = "운영 상태";
            mainChip.classList.remove("active");
        }
    }

    closeModal();
    fetchFilteredPopups(); // 새로 고침
}

function resetTempFilters() {
    tempSelectedItems = [];
    document.querySelectorAll("#modal-chip-grid .sub-chip").forEach(btn => btn.classList.remove("active"));
}

function closeModal() {
    const modal = document.getElementById("filter-modal");
    if (modal) modal.classList.remove("show");
    tempSelectedItems = [];
    activeModalType = "";
}

