document.addEventListener("DOMContentLoaded", () => {
    // 1. 페이지 내 모든 가로 스크롤 컨테이너들을 가져옴
    const scrollContainers = document.querySelectorAll(".card-scroll-container");

    scrollContainers.forEach((container) => {
        let isDown = false;
        let startX;
        let scrollLeft;

        // 마우스 버튼을 누른 순간
        container.addEventListener("mousedown", (e) => {
            isDown = true;
            container.classList.add("active");
            // 클릭한 절대 좌표에서 이미 스크롤된 만큼을 계산
            startX = e.pageX - container.offsetLeft;
            scrollLeft = container.scrollLeft;

            // 드래그 중 텍스트나 이미지가 블록 지정되는 현상 방지
            container.style.cursor = "grabbing";
            container.style.userSelect = "none";
        });

        // 마우스가 스크롤 영역 밖으로 벗어났을 때
        container.addEventListener("mouseleave", () => {
            isDown = false;
            container.style.cursor = "grab";
        });

        // 마우스 버튼을 뗐을 때
        container.addEventListener("mouseup", () => {
            isDown = false;
            container.style.cursor = "grab";
        });

        // 마우스를 움직이는(드래그) 동안
        container.addEventListener("mousemove", (e) => {
            if (!isDown) return; // 마우스가 눌린 상태가 아니라면 함수 종료
            e.preventDefault();

            const x = e.pageX - container.offsetLeft;
            // 드래그 속도 조절 (숫자가 높을수록 빠르게 스크롤됨)
            const walk = (x - startX) * 1.5;
            container.scrollLeft = scrollLeft - walk;
        });

        // 초기 마우스 커서 모양을 잡기 편하게 손모양(grab)으로 지정
        container.style.cursor = "grab";
    });
});

document.addEventListener("DOMContentLoaded", () => {
    // ==========================================
    // 1. 동적 별점 생성기 (5점 만점 기준)
    // ==========================================
    const ratingContainers = document.querySelectorAll(".rating-stars");

    ratingContainers.forEach(container => {
        const score = Math.floor(parseFloat(container.dataset.score)); // ex) 3.0 -> 3
        let starsHtml = "";

        for (let i = 1; i <= 5; i++) {
            if (i <= score) {
                // 채워진 별 추가
                starsHtml += `<img src="/assets/images/icons/icon-star-fill.png" alt="별">`;
            } else {
                // 비워진 별 추가
                starsHtml += `<img src="/assets/images/icons/icon-star-empty.png" alt="빈 별">`;
            }
        }
        container.innerHTML = starsHtml;
    });

    // ==========================================
    // 2. 동적 혼잡도 생성기 (3칸 만점 기준)
    // ==========================================
    const congestionContainers = document.querySelectorAll(".congestion-icons");

    congestionContainers.forEach(container => {
        const status = container.dataset.status; // '낮음', '보통', '높음'
        let fillCount = 1; // 기본값 '낮음'은 1개 채움

        if (status === "보통") fillCount = 2;
        if (status === "높음") fillCount = 3;

        let peopleHtml = "";

        for (let i = 1; i <= 3; i++) {
            if (i <= fillCount) {
                // 채워진 사람 추가
                peopleHtml += `<img src="/assets/images/icons/icon-person-fill.png" alt="사람 채움">`;
            } else {
                // 비워진 사람 테두리 추가
                peopleHtml += `<img src="/assets/images/icons/icon-person-empty.png" alt="사람 비움">`;
            }
        }
        container.innerHTML = peopleHtml;
    });
});