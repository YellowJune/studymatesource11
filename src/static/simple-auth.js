// 전역 변수
let currentUserId = null;

// 페이지 로드 시 초기화
document.addEventListener("DOMContentLoaded", function() {
    // URL 쿼리 파라미터에서 user 확인
    const urlParams = new URLSearchParams(window.location.search);
    const userParam = urlParams.get('user');
    
    if (userParam) {
        // URL에 user 파라미터가 있으면 해당 ID로 로그인
        currentUserId = userParam;
        localStorage.setItem("studymate_user_id", userParam);
        showMainContent();
        updateUserInfo();
    } else {
        // URL에 user 파라미터가 없으면 로컬 스토리지 확인
        const savedUserId = localStorage.getItem("studymate_user_id");
        if (savedUserId) {
            currentUserId = savedUserId;
            showMainContent();
            updateUserInfo();
        } else {
            showIdInputForm();
        }
    }
});

// ID 입력 폼 표시
function showIdInputForm() {
    document.getElementById("id-input-container").style.display = "block";
    document.getElementById("main-content").style.display = "none";
}

// 메인 콘텐츠 표시
function showMainContent() {
    document.getElementById("id-input-container").style.display = "none";
    document.getElementById("main-content").style.display = "block";
    
    // 플래너 초기화
    if (typeof initializeApp === "function") {
        initializeApp();
    }
}

// 사용자 정보 업데이트
function updateUserInfo() {
    if (currentUserId) {
        document.getElementById("current-user-display").textContent = currentUserId;
    }
}

// ID 제출 처리
function handleIdSubmit(event) {
    event.preventDefault();
    
    const userId = document.getElementById("user-id-input").value.trim();
    
    if (!userId) {
        showIdMessage("사용자 ID를 입력해주세요.", "error");
        return;
    }
    
    // 간단한 ID 유효성 검사 (영문, 숫자, 언더스코어만 허용)
    const idPattern = /^[a-zA-Z0-9_]+$/;
    if (!idPattern.test(userId)) {
        showIdMessage("사용자 ID는 영문, 숫자, 언더스코어(_)만 사용할 수 있습니다.", "error");
        return;
    }
    
    // 사용자 ID 저장 및 로그인
    currentUserId = userId;
    localStorage.setItem("studymate_user_id", userId);
    
    showIdMessage("로그인 성공! 플래너로 이동합니다.", "success");
    
    // 1초 후 메인 화면으로 이동
    setTimeout(() => {
        showMainContent();
        updateUserInfo();
    }, 1000);
}

// 로그아웃 기능
function logout() {
    if (confirm("정말 로그아웃하시겠습니까?")) {
        // 로컬 스토리지에서 사용자 ID 제거
        currentUserId = null;
        localStorage.removeItem("studymate_user_id");
        
        // 입력 필드 초기화
        document.getElementById("user-id-input").value = "";
        
        // URL에서 user 파라미터 제거
        const url = new URL(window.location);
        url.searchParams.delete('user');
        window.history.replaceState({}, document.title, url.pathname);
        
        showIdInputForm();
    }
}

// ID 메시지 표시
function showIdMessage(message, type = "info") {
    const messageElement = document.getElementById("id-message");
    
    messageElement.textContent = message;
    messageElement.className = "";
    messageElement.style.display = "block";
    
    if (type === "success") {
        messageElement.style.background = "#d4edda";
        messageElement.style.color = "#155724";
        messageElement.style.border = "1px solid #c3e6cb";
    } else if (type === "error") {
        messageElement.style.background = "#f8d7da";
        messageElement.style.color = "#721c24";
        messageElement.style.border = "1px solid #f5c6cb";
    } else {
        messageElement.style.background = "#d1ecf1";
        messageElement.style.color = "#0c5460";
        messageElement.style.border = "1px solid #bee5eb";
    }
    
    // 3초 후 자동 제거 (성공 메시지가 아닌 경우)
    if (type !== "success") {
        setTimeout(() => {
            messageElement.style.display = "none";
        }, 3000);
    }
}

// 현재 사용자 ID 반환 (플래너에서 사용)
function getCurrentUserId() {
    return currentUserId;
}

// 인증 상태 확인 (플래너에서 사용)
function isUserAuthenticated() {
    return currentUserId !== null;
}
