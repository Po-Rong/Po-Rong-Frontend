/**
 * PORONG 팝업스토어 - 카카오 지도(Kakao Map) API 연동 스크립트
 * 
 * - 특정 팝업스토어의 위도(latitude), 경도(longitude) 데이터를 받아서 지도를 렌더링합니다.
 * - 좌표 정보가 누락되었거나 비정상적인 경우 지도 영역을 완전히 숨김(display: none) 처리합니다.
 */
function initKakaoMap(popup) {
    const mapSection = document.getElementById("map-section");
    const mapDivider = document.getElementById("map-divider");
    const mapContainer = document.getElementById("map");

    if (!mapSection || !mapContainer) return;

    // 1. 위도(latitude) 또는 경도(longitude) 데이터 유무 정밀 체크
    if (
        !popup ||
        popup.latitude === null ||
        popup.latitude === undefined ||
        popup.longitude === null ||
        popup.longitude === undefined
    ) {
        // 좌표가 없는 경우 찾아오는 길 색션과 디바이더 숨김 처리
        mapSection.style.display = "none";
        if (mapDivider) mapDivider.style.display = "none";
        return;
    }

    try {
        const lat = parseFloat(popup.latitude);
        const lng = parseFloat(popup.longitude);

        // 2. 숫자가 아니거나 유효하지 않은 좌표일 경우 숨김 처리
        if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
            mapSection.style.display = "none";
            if (mapDivider) mapDivider.style.display = "none";
            return;
        }

        // 3. 지도가 준비되면 컨테이너와 구분선 활성화
        mapSection.style.display = "block";
        if (mapDivider) mapDivider.style.display = "block";

        // 4. 카카오 맵 초기 설정 및 생성
        const mapOption = {
            center: new kakao.maps.LatLng(lat, lng), // 지도의 중심좌표 설정
            level: 3 // 지도의 확대 레벨 (클수록 확대됨)
        };

        const map = new kakao.maps.Map(mapContainer, mapOption);

        // 5. 마커(Marker) 객체 생성 및 지도 위에 표시 (커스텀 마커핀 이미지 적용)
        const markerPosition = new kakao.maps.LatLng(lat, lng);

        const imageSrc = '/assets/images/icons/icon-map-marker(5).png'; // 커스텀 마커 이미지 주소
        const imageSize = new kakao.maps.Size(100, 100);                // 극대화한 마커 이미지 크기 (80px x 80px)
        const imageOption = { offset: new kakao.maps.Point(40, 80) }; // 확대된 마커 크기에 맞춤 오프셋 (가로 중앙 40px, 세로 바닥 80px)

        const markerImage = new kakao.maps.MarkerImage(imageSrc, imageSize, imageOption);

        const marker = new kakao.maps.Marker({
            position: markerPosition,
            image: markerImage // 커스텀 마커 이미지 설정
        });
        marker.setMap(map);

        // 6. 마커 위에 팝업스토어의 이름을 띄워줄 인포윈도우(InfoWindow) 커스텀 컨텐츠 생성
        const iwContent = `
            <div style="padding: 10px; min-width: 150px; text-align: center; font-family: 'Pretendard', sans-serif; font-size: 13px; color: #4C4C4C; line-height: 1.4;">
                <div style="margin-bottom: 4px; color: #9C8CF2; font-weight: 700; font-size: 14px;">${popup.title}</div>
                <div style="font-size: 11px; color: #777;">여기서 진행되고 있어요!</div>
            </div>
        `;
        const infowindow = new kakao.maps.InfoWindow({
            content: iwContent,
            removable: false // 사용자가 끄지 않도록 고정
        });

        // 7. 인포윈도우를 지도 위에 항상 열어둔 상태로 로드
        infowindow.open(map, marker);

        // 8. 윈도우 리사이즈 대응 (화면 크기 변경 시 마커가 중심에 오도록 재정렬)
        window.addEventListener('resize', () => {
            const moveLatLon = new kakao.maps.LatLng(lat, lng);
            map.setCenter(moveLatLon);
        });

        console.log(`[Kakao Map] '${popup.title}' 팝업스토어 지도 연동 성공 (위도: ${lat}, 경도: ${lng})`);

    } catch (error) {
        console.error("[Kakao Map] 지도 객체 생성 및 렌더링 중 오류 발생: ", error);
        mapSection.style.display = "none";
        if (mapDivider) mapDivider.style.display = "none";
    }
}
