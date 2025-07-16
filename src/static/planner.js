// 전역 변수
let currentDate = new Date();
let currentUserId = 1; // 기본 사용자 ID (실제로는 URL에서 추출)
let currentPlans = [];
let editingPlanId = null;

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    // URL에서 사용자 ID 추출
    const pathParts = window.location.pathname.split('/');
    if (pathParts.includes('planner') && pathParts[pathParts.indexOf('planner') + 1]) {
        currentUserId = parseInt(pathParts[pathParts.indexOf('planner') + 1]);
    }
    
    initializeCalendar();
    loadPlans();
    loadStats();
});

// 캘린더 초기화
function initializeCalendar() {
    updateCalendarHeader();
    renderCalendar();
}

// 캘린더 헤더 업데이트
function updateCalendarHeader() {
    const monthNames = [
        '1월', '2월', '3월', '4월', '5월', '6월',
        '7월', '8월', '9월', '10월', '11월', '12월'
    ];
    
    const monthElement = document.getElementById('current-month');
    monthElement.textContent = `${currentDate.getFullYear()}년 ${monthNames[currentDate.getMonth()]}`;
}

// 캘린더 렌더링
function renderCalendar() {
    const calendar = document.getElementById('calendar');
    calendar.innerHTML = '';
    
    // 요일 헤더 추가
    const dayHeaders = ['일', '월', '화', '수', '목', '금', '토'];
    dayHeaders.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-day-header';
        dayHeader.style.cssText = `
            background: #f8f9fa;
            padding: 10px;
            text-align: center;
            font-weight: 600;
            color: #666;
            border-bottom: 2px solid #e9ecef;
        `;
        dayHeader.textContent = day;
        calendar.appendChild(dayHeader);
    });
    
    // 달력 날짜 생성
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // 이번 달 첫째 날과 마지막 날
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // 첫째 주 시작일 (일요일부터)
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    // 마지막 주 종료일
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));
    
    // 날짜별 셀 생성
    const currentDateObj = new Date(startDate);
    while (currentDateObj <= endDate) {
        const dayElement = createDayElement(currentDateObj, month);
        calendar.appendChild(dayElement);
        currentDateObj.setDate(currentDateObj.getDate() + 1);
    }
}

// 날짜 셀 생성
function createDayElement(date, currentMonth) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    
    const isCurrentMonth = date.getMonth() === currentMonth;
    const isToday = isDateToday(date);
    
    if (!isCurrentMonth) {
        dayElement.classList.add('other-month');
    }
    
    if (isToday) {
        dayElement.classList.add('today');
    }
    
    // 날짜 번호
    const dayNumber = document.createElement('div');
    dayNumber.className = 'day-number';
    dayNumber.textContent = date.getDate();
    dayElement.appendChild(dayNumber);
    
    // 해당 날짜의 계획들
    const dayPlans = document.createElement('div');
    dayPlans.className = 'day-plans';
    
    const dateStr = formatDate(date);
    const plansForDay = currentPlans.filter(plan => plan.plan_date === dateStr);
    
    plansForDay.forEach(plan => {
        const planElement = document.createElement('div');
        planElement.className = `plan-item ${plan.priority}`;
        planElement.textContent = plan.title;
        planElement.onclick = (e) => {
            e.stopPropagation();
            editPlan(plan);
        };
        dayPlans.appendChild(planElement);
    });
    
    dayElement.appendChild(dayPlans);
    
    // 클릭 이벤트 (새 계획 추가)
    dayElement.onclick = () => {
        openAddPlanModal(date);
    };
    
    return dayElement;
}

// 오늘 날짜인지 확인
function isDateToday(date) {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
}

// 날짜 포맷팅 (YYYY-MM-DD)
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 이전 달로 이동
function previousMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    initializeCalendar();
    loadPlans();
}

// 다음 달로 이동
function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    initializeCalendar();
    loadPlans();
}

// 오늘로 이동
function goToToday() {
    currentDate = new Date();
    initializeCalendar();
    loadPlans();
}

// 계획 추가 모달 열기
function openAddPlanModal(date = null) {
    editingPlanId = null;
    document.getElementById('modal-title').textContent = '새 계획 추가';
    document.getElementById('plan-form').reset();
    
    if (date) {
        document.getElementById('plan-date').value = formatDate(date);
    } else {
        document.getElementById('plan-date').value = formatDate(new Date());
    }
    
    document.getElementById('plan-modal').style.display = 'block';
}

// 계획 수정 모달 열기
function editPlan(plan) {
    editingPlanId = plan.id;
    document.getElementById('modal-title').textContent = '계획 수정';
    
    document.getElementById('plan-title').value = plan.title;
    document.getElementById('plan-description').value = plan.description || '';
    document.getElementById('plan-date').value = plan.plan_date;
    document.getElementById('plan-start-time').value = plan.start_time || '';
    document.getElementById('plan-end-time').value = plan.end_time || '';
    document.getElementById('plan-subject').value = plan.subject || '';
    document.getElementById('plan-priority').value = plan.priority;
    document.getElementById('plan-status').value = plan.status;
    
    document.getElementById('plan-modal').style.display = 'block';
}

// 모달 닫기
function closePlanModal() {
    document.getElementById('plan-modal').style.display = 'none';
    editingPlanId = null;
}

// 계획 폼 제출
document.getElementById('plan-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const planData = {
        user_id: currentUserId,
        title: document.getElementById('plan-title').value,
        description: document.getElementById('plan-description').value,
        plan_date: document.getElementById('plan-date').value,
        start_time: document.getElementById('plan-start-time').value || null,
        end_time: document.getElementById('plan-end-time').value || null,
        subject: document.getElementById('plan-subject').value || null,
        priority: document.getElementById('plan-priority').value,
        status: document.getElementById('plan-status').value
    };
    
    if (editingPlanId) {
        updatePlan(editingPlanId, planData);
    } else {
        createPlan(planData);
    }
});

// 계획 생성
async function createPlan(planData) {
    try {
        const response = await fetch('/api/planner/plans', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(planData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            closePlanModal();
            loadPlans();
            loadStats();
            showNotification('계획이 성공적으로 추가되었습니다!', 'success');
        } else {
            showNotification('계획 추가에 실패했습니다: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('Error creating plan:', error);
        showNotification('계획 추가 중 오류가 발생했습니다.', 'error');
    }
}

// 계획 수정
async function updatePlan(planId, planData) {
    try {
        const response = await fetch(`/api/planner/plans/${planId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(planData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            closePlanModal();
            loadPlans();
            loadStats();
            showNotification('계획이 성공적으로 수정되었습니다!', 'success');
        } else {
            showNotification('계획 수정에 실패했습니다: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('Error updating plan:', error);
        showNotification('계획 수정 중 오류가 발생했습니다.', 'error');
    }
}

// 계획 목록 로드
async function loadPlans() {
    try {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0);
        
        const response = await fetch(
            `/api/planner/plans/${currentUserId}?start_date=${formatDate(startDate)}&end_date=${formatDate(endDate)}`
        );
        
        const result = await response.json();
        
        if (result.success) {
            currentPlans = result.plans;
            renderCalendar(); // 계획이 로드된 후 캘린더 다시 렌더링
        } else {
            console.error('Failed to load plans:', result.error);
        }
    } catch (error) {
        console.error('Error loading plans:', error);
    }
}

// 통계 로드
async function loadStats() {
    try {
        const response = await fetch(`/api/planner/stats/${currentUserId}`);
        const result = await response.json();
        
        if (result.success) {
            const stats = result.stats;
            
            document.getElementById('total-plans').textContent = stats.total_plans;
            document.getElementById('completed-plans').textContent = stats.completed_plans;
            document.getElementById('progress-plans').textContent = stats.in_progress_plans;
            document.getElementById('completion-rate').textContent = stats.completion_rate + '%';
            
            // 과목별 통계 렌더링
            renderSubjectStats(stats.subject_stats);
        } else {
            console.error('Failed to load stats:', result.error);
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// 과목별 통계 렌더링
function renderSubjectStats(subjectStats) {
    const container = document.getElementById('subject-stats');
    container.innerHTML = '';
    
    if (Object.keys(subjectStats).length === 0) {
        container.innerHTML = '<div style="color: #999; text-align: center;">데이터가 없습니다</div>';
        return;
    }
    
    Object.entries(subjectStats).forEach(([subject, stats]) => {
        const statItem = document.createElement('div');
        statItem.className = 'stat-item';
        
        const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
        
        statItem.innerHTML = `
            <span class="stat-label">${subject}</span>
            <span class="stat-value">${stats.completed}/${stats.total} (${completionRate}%)</span>
        `;
        
        container.appendChild(statItem);
    });
}

// 알림 표시
function showNotification(message, type = 'info') {
    // 간단한 알림 구현
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        z-index: 10000;
        max-width: 300px;
        word-wrap: break-word;
    `;
    
    if (type === 'success') {
        notification.style.background = '#28a745';
    } else if (type === 'error') {
        notification.style.background = '#dc3545';
    } else {
        notification.style.background = '#17a2b8';
    }
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        document.body.removeChild(notification);
    }, 3000);
}

// 모달 외부 클릭 시 닫기
window.onclick = function(event) {
    const modal = document.getElementById('plan-modal');
    if (event.target === modal) {
        closePlanModal();
    }
}

