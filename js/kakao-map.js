/**
 * 카카오 지도(Kakao Map) API 연동 라이브러리
 */

function initKakaoMap(popup) {
    const mapSection = document.getElementById("map-section");
    const mapDivider = document.getElementById("map-divider");
    const mapContainer = document.getElementById("map");

    if (!mapSection || !mapContainer) return;

    // [1] 위도 및 경도 데이터의 존재 여부 정밀 검증
    if (
        !popup ||
        popup.latitude === null ||
        popup.latitude === undefined ||
        popup.longitude === null ||
        popup.longitude === undefined
    ) {
        mapSection.style.display = "none";
        if (mapDivider) mapDivider.style.display = "none";
        return;
    }

    try {
        const lat = parseFloat(popup.latitude);
        const lng = parseFloat(popup.longitude);

        // [2] 유효하지 않은 실숫값(NaN 또는 0)일 경우 레이아웃 숨김 처리
        if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
            mapSection.style.display = "none";
            if (mapDivider) mapDivider.style.display = "none";
            return;
        }

        // [3] 검증 완료 시 지도 섹션 활성화
        mapSection.style.display = "block";
        if (mapDivider) mapDivider.style.display = "block";

        // [4] 카카오 맵 초기 설정 및 생성
        // * 오버레이(말풍선) 카드의 수직 여백 공간을 확보하기 위해 중심점 위도를 미세하게(+0.0004) 상향 조정
        const mapOption = {
            center: new kakao.maps.LatLng(lat + 0.0004, lng),
            level: 3 // 지도 확대/축소 레벨
        };

        const map = new kakao.maps.Map(mapContainer, mapOption);

        // [5] 지도 제어 기능 탑재 (지도 전환 및 확대/축소 컨트롤 바 동적 추가)
        const mapTypeControl = new kakao.maps.MapTypeControl();
        map.addControl(mapTypeControl, kakao.maps.ControlPosition.TOPRIGHT);

        const zoomControl = new kakao.maps.ZoomControl();
        map.addControl(zoomControl, kakao.maps.ControlPosition.RIGHT);

        // [6] 커스텀 브랜드 마커 이미지 정의 및 지도에 배치
        const markerPosition = new kakao.maps.LatLng(lat, lng);
        const imageSrc = '/assets/images/icons/icon-map-marker(5).png'; // 커스텀 마커 경로
        const imageSize = new kakao.maps.Size(80, 80);                // 마커 크기 (80px x 80px)
        const imageOption = { offset: new kakao.maps.Point(40, 80) }; // 하단 중심 맞춤 오프셋

        const markerImage = new kakao.maps.MarkerImage(imageSrc, imageSize, imageOption);

        const marker = new kakao.maps.Marker({
            position: markerPosition,
            image: markerImage
        });
        marker.setMap(map);

        // [7] 프리미엄 커스텀 오버레이 (길찾기 및 로드뷰 바로가기) 동적 HTML 구성
        const kakaoMapRouteUrl = `https://map.kakao.com/link/to/${encodeURIComponent(popup.title)},${lat},${lng}`;
        const kakaoRoadviewUrl = `https://map.kakao.com/link/roadview/${lat},${lng}`;

        const contentHtml = `
            <div style="
                position: relative; 
                background: #ffffff; 
                border: 1px solid #e0dafc; 
                border-radius: 12px; 
                box-shadow: 0 8px 24px rgba(156, 140, 242, 0.18); 
                padding: 14px 16px; 
                min-width: 210px; 
                font-family: 'Pretendard', sans-serif; 
                display: flex; 
                flex-direction: column; 
                align-items: center;
                margin-bottom: 90px;
            ">
                <!-- 팝업 명칭 정보 -->
                <div style="margin-bottom: 4px; color: #9C8CF2; font-weight: 700; font-size: 14px; text-align: center; white-space: nowrap;">${popup.title}</div>
                <div style="font-size: 11px; color: #666; text-align: center; margin-bottom: 12px; white-space: nowrap;">방문 전에 길찾기 경로를 확인해 보세요!</div>
                
                <!-- 하단 상호작용 버튼 그룹 -->
                <div style="display: flex; gap: 8px; width: 100%; justify-content: center;">
                    <a href="${kakaoMapRouteUrl}" target="_blank" style="flex: 1; text-align: center; background-color: #9C8CF2; color: #fff; padding: 8px 0; font-size: 11px; font-weight: 600; border-radius: 6px; text-decoration: none; display: inline-block; transition: background-color 0.2s;">
                        길찾기
                    </a>
                    <a href="${kakaoRoadviewUrl}" target="_blank" style="flex: 1; text-align: center; background-color: #f1effd; color: #9C8CF2; padding: 8px 0; font-size: 11px; font-weight: 600; border-radius: 6px; text-decoration: none; border: 1px solid #e0dafc; display: inline-block; transition: all 0.2s;">
                        로드뷰
                    </a>
                </div>
                
                <!-- 하단 말꼬리 모양 삼각 테두리 데코레이션 -->
                <div style="
                    position: absolute; 
                    bottom: -8px; 
                    left: 50%; 
                    transform: translateX(-50%); 
                    width: 0; 
                    height: 0; 
                    border-left: 8px solid transparent; 
                    border-right: 8px solid transparent; 
                    border-top: 8px solid #ffffff;
                "></div>
                <div style="
                    position: absolute; 
                    bottom: -9px; 
                    left: 50%; 
                    transform: translateX(-50%); 
                    width: 0; 
                    height: 0; 
                    border-left: 9px solid transparent; 
                    border-right: 9px solid transparent; 
                    border-top: 9px solid #e0dafc;
                    z-index: -1;
                "></div>
            </div>
        `;

        const customOverlay = new kakao.maps.CustomOverlay({
            content: contentHtml,
            position: markerPosition,
            xAnchor: 0.5,
            yAnchor: 1.0
        });

        customOverlay.setMap(map);

        // [8] 윈도우 리사이즈(반응형) 대응: 브라우저 크기 변경 시에도 마커 중심 구도를 정밀 유지
        window.addEventListener('resize', () => {
            const moveLatLon = new kakao.maps.LatLng(lat + 0.0004, lng);
            map.setCenter(moveLatLon);
        });

        // [9] 지도 중심 재정렬 플로팅 버튼 동적 생성 및 삽입
        const focusBtn = document.createElement('button');
        focusBtn.className = 'map-focus-btn';
        focusBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7259ff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:block;">
                <circle cx="12" cy="12" r="10"></circle>
                <circle cx="12" cy="12" r="3" fill="#7c65ff"></circle>
                <line x1="12" y1="1" x2="12" y2="4"></line>
                <line x1="12" y1="20" x2="12" y2="23"></line>
                <line x1="1" y1="12" x2="4" y2="12"></line>
                <line x1="20" y1="12" x2="23" y2="12"></line>
            </svg>
        `;
        focusBtn.setAttribute('title', '팝업스토어 위치로 지도 맞춤');
        focusBtn.style.cssText = `
            position: absolute;
            bottom: 20px;
            right: 20px;
            z-index: 10;
            width: 42px;
            height: 42px;
            border-radius: 50%;
            background-color: #ffffff;
            border: 1px solid #e0dafc;
            box-shadow: 0 4px 12px rgba(156, 140, 242, 0.2);
            cursor: pointer;
            font-size: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
            outline: none;
        `;

        focusBtn.addEventListener('mouseenter', () => {
            focusBtn.style.transform = 'scale(1.1)';
            focusBtn.style.backgroundColor = '#f8f7ff';
            focusBtn.style.boxShadow = '0 6px 16px rgba(156, 140, 242, 0.3)';
        });
        focusBtn.addEventListener('mouseleave', () => {
            focusBtn.style.transform = 'scale(1)';
            focusBtn.style.backgroundColor = '#ffffff';
            focusBtn.style.boxShadow = '0 4px 12px rgba(156, 140, 242, 0.2)';
        });

        // 클릭 이벤트: 팝업스토어 중심 좌표로 카메라를 이동 (panTo)
        focusBtn.addEventListener('click', () => {
            const targetPos = new kakao.maps.LatLng(lat + 0.0004, lng);
            map.panTo(targetPos);
        });

        mapContainer.style.position = 'relative';
        mapContainer.appendChild(focusBtn);

        console.log(`[Kakao Map] '${popup.title}' 팝업스토어 지도 연동 성공 (위도: ${lat}, 경도: ${lng})`);

    } catch (error) {
        console.error("[Kakao Map] 지도 객체 생성 및 렌더링 중 오류 발생: ", error);
        mapSection.style.display = "none";
        if (mapDivider) mapDivider.style.display = "none";
    }
}
