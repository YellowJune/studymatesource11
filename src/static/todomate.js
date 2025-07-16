// 전역 변수
let allTasks = [];
let filteredTasks = [];
let currentFilter = 'today';
let currentDate = new Date();
let editingTaskId = null;

// 페이지 로드 시 초기화 (인증 확인 후 실행)
// DOMContentLoaded 이벤트는 simple-auth.js에서 처리하고,
// simple-auth.js에서 showMainContent() 호출 시 initializeApp()을 호출합니다.
function initializeApp() {
    updateCurrentDate();
    loadTasks();
    setupFilters();
    setupEventListeners();
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 필터 클릭 이벤트
    document.querySelectorAll('.filter-item').forEach(item => {
        item.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            if (filter) {
                setActiveFilter(filter);
                applyFilter(filter);
            }
        });
    });
}

// 현재 날짜 업데이트
function updateCurrentDate() {
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        weekday: 'long'
    };
    const dateStr = currentDate.toLocaleDateString('ko-KR', options);
    document.getElementById('current-date').textContent = dateStr;
}

// 할 일 목록 로드
async function loadTasks() {
    try {
        // simple-auth.js에서 제공하는 함수 사용
        if (!isUserAuthenticated()) {
            console.log('사용자가 인증되지 않음');
            showNotification('사용자 ID를 입력해주세요.', 'info');
            return;
        }
        
        showNotification('할 일 목록을 불러오는 중...', 'info');
        
        const userId = getCurrentUserId(); // simple-auth.js에서 제공하는 함수 사용
        const response = await axios.get(`/api/planner/plans/${userId}`);
        allTasks = response.data.plans; // 'plans' 키 아래에 데이터가 있다고 가정
        
        applyFilter(currentFilter);
        updateStats();
        updateFilterCounts();
        
        showNotification('할 일 목록을 성공적으로 불러왔습니다!', 'success');
    } catch (error) {
        console.error('할 일 로드 실패:', error);
        showNotification('할 일 목록을 불러오는데 실패했습니다.', 'error');
        
        // 빈 목록으로 초기화
        allTasks = [];
        applyFilter(currentFilter);
        updateStats();
        updateFilterCounts();
    }
}

// 할 일 추가
async function addTask(taskData) {
    try {
        if (!isUserAuthenticated()) {
            showNotification('사용자 ID가 필요합니다.', 'error');
            return;
        }

        showNotification('할 일을 추가하는 중...', 'info');
        
        // 사용자 ID 추가
        taskData.user_id = getCurrentUserId(); // simple-auth.js에서 제공하는 함수 사용
        
        const response = await axios.post('/api/planner/plans', taskData);
        
        // 목록에 새 할 일 추가
        allTasks.push(response.data);
        
        applyFilter(currentFilter);
        updateStats();
        updateFilterCounts();
        
        showNotification('할 일이 성공적으로 추가되었습니다!', 'success');
        closeTaskModal();
    } catch (error) {
        console.error('할 일 추가 실패:', error);
        showNotification('할 일 추가 중 오류가 발생했습니다.', 'error');
    }
}

// 할 일 수정
async function updateTask(taskId, taskData) {
    try {
        if (!isUserAuthenticated()) {
            showNotification('사용자 ID가 필요합니다.', 'error');
            return;
        }

        showNotification('할 일을 수정하는 중...', 'info');
        
        // 사용자 ID 추가
        taskData.user_id = getCurrentUserId(); // simple-auth.js에서 제공하는 함수 사용
        
        const response = await axios.put(`/api/planner/plans/${taskId}`, taskData);
        
        // 목록에서 해당 할 일 업데이트
        const index = allTasks.findIndex(task => task.id === taskId);
        if (index !== -1) {
            allTasks[index] = response.data;
        }
        
        applyFilter(currentFilter);
        updateStats();
        updateFilterCounts();
        
        showNotification('할 일이 성공적으로 수정되었습니다!', 'success');
        closeTaskModal();
    } catch (error) {
        console.error('할 일 수정 실패:', error);
        showNotification('할 일 수정 중 오류가 발생했습니다.', 'error');
    }
}

// 할 일 삭제
async function deleteTask() {
    if (!editingTaskId) return;
    
    if (!confirm('정말로 이 할 일을 삭제하시겠습니까?')) {
        return;
    }
    
    try {
        showNotification('할 일을 삭제하는 중...', 'info');
        
        await axios.delete(`/api/planner/plans/${editingTaskId}`);
        
        // 목록에서 해당 할 일 제거
        allTasks = allTasks.filter(task => task.id !== editingTaskId);
        
        applyFilter(currentFilter);
        updateStats();
        updateFilterCounts();
        
        showNotification('할 일이 성공적으로 삭제되었습니다!', 'success');
        closeTaskModal();
    } catch (error) {
        console.error('할 일 삭제 실패:', error);
        showNotification('할 일 삭제 중 오류가 발생했습니다.', 'error');
    }
}

// 할 일 상태 토글
async function toggleTaskStatus(taskId) {
    if (!isUserAuthenticated()) {
        showNotification('사용자 ID가 필요합니다.', 'error');
        return;
    }

    const task = allTasks.find(t => t.id === taskId);
    if (!task) return;
    
    const newStatus = task.status === 'completed' ? 'planned' : 'completed';
    
    try {
        const taskData = {
            ...task,
            status: newStatus,
            user_id: getCurrentUserId() // simple-auth.js에서 제공하는 함수 사용
        };
        
        const response = await axios.put(`/api/planner/plans/${taskId}`, taskData);
        
        // 목록에서 해당 할 일 업데이트
        const index = allTasks.findIndex(t => t.id === taskId);
        if (index !== -1) {
            allTasks[index] = response.data;
        }
        
        applyFilter(currentFilter);
        updateStats();
        updateFilterCounts();
        
        const statusText = newStatus === 'completed' ? '완료' : '미완료';
        showNotification(`할 일이 ${statusText}로 변경되었습니다.`, 'success');
    } catch (error) {
        console.error('할 일 상태 변경 실패:', error);
        showNotification('할 일 상태 변경 중 오류가 발생했습니다.', 'error');
    }
}

// 필터 적용
function applyFilter(filterType) {
    currentFilter = filterType;
    
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    switch (filterType) {
        case 'today':
            filteredTasks = allTasks.filter(task => {
                const taskDate = new Date(task.plan_date);
                return taskDate.toDateString() === today.toDateString();
            });
            break;
        case 'tomorrow':
            filteredTasks = allTasks.filter(task => {
                const taskDate = new Date(task.plan_date);
                return taskDate.toDateString() === tomorrow.toDateString();
            });
            break;
        case 'week':
            filteredTasks = allTasks.filter(task => {
                const taskDate = new Date(task.plan_date);
                return taskDate >= startOfWeek && taskDate <= endOfWeek;
            });
            break;
        case 'planned':
        case 'in_progress':
        case 'completed':
        case 'cancelled':
            filteredTasks = allTasks.filter(task => task.status === filterType);
            break;
        case 'all':
        default:
            filteredTasks = [...allTasks];
            break;
    }
    
    // 과목별 필터인 경우
    if (!['today', 'tomorrow', 'week', 'all', 'planned', 'in_progress', 'completed', 'cancelled'].includes(filterType)) {
        filteredTasks = allTasks.filter(task => task.subject === filterType);
    }
    
    renderTasks();
}

// 활성 필터 설정
function setActiveFilter(filterType) {
    document.querySelectorAll('.filter-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const activeFilter = document.querySelector(`[data-filter="${filterType}"]`);
    if (activeFilter) {
        activeFilter.classList.add('active');
    }
}

// 할 일 목록 렌더링
function renderTasks() {
    const taskList = document.getElementById('task-list');
    
    if (filteredTasks.length === 0) {
        taskList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📝</div>
                <h3>할 일이 없습니다</h3>
                <p>새로운 할 일을 추가해보세요!</p>
            </div>
        `;
        return;
    }
    
    // 날짜와 시간순으로 정렬
    const sortedTasks = [...filteredTasks].sort((a, b) => {
        const dateA = new Date(a.plan_date + (a.start_time ? ' ' + a.start_time : ''));
        const dateB = new Date(b.plan_date + (b.start_time ? ' ' + b.start_time : ''));
        return dateA - dateB;
    });
    
    taskList.innerHTML = sortedTasks.map(task => `
        <div class="task-item ${task.priority} ${task.status === 'completed' ? 'completed' : ''}" onclick="openEditTaskModal(${task.id})">
            <div class="task-checkbox ${task.status === 'completed' ? 'checked' : ''}" onclick="event.stopPropagation(); toggleTaskStatus(${task.id})"></div>
            <div class="task-content">
                <div class="task-title">${task.title}</div>
                <div class="task-meta">
                    ${task.start_time ? `<div class="task-time">🕐 ${task.start_time}${task.end_time ? ' - ' + task.end_time : ''}</div>` : ''}
                    ${task.subject ? `<div class="task-subject">${task.subject}</div>` : ''}
                    <div class="task-priority priority-${task.priority}">${getPriorityText(task.priority)}</div>
                </div>
            </div>
        </div>
    `).join('');
}

// 우선순위 텍스트 반환
function getPriorityText(priority) {
    switch (priority) {
        case 'high': return '높음';
        case 'medium': return '보통';
        case 'low': return '낮음';
        default: return '보통';
    }
}

// 통계 업데이트
function updateStats() {
    const completed = allTasks.filter(task => task.status === 'completed').length;
    const total = allTasks.length;
    const remaining = total - completed;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    document.getElementById('header-completed').textContent = completed;
    document.getElementById('header-remaining').textContent = remaining;
    document.getElementById('header-rate').textContent = rate + '%';
}

// 필터 카운트 업데이트
function updateFilterCounts() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    // 날짜별 카운트
    const todayCount = allTasks.filter(task => {
        const taskDate = new Date(task.plan_date);
        return taskDate.toDateString() === today.toDateString();
    }).length;
    
    const tomorrowCount = allTasks.filter(task => {
        const taskDate = new Date(task.plan_date);
        return taskDate.toDateString() === tomorrow.toDateString();
    }).length;
    
    const weekCount = allTasks.filter(task => {
        const taskDate = new Date(task.plan_date);
        return taskDate >= startOfWeek && taskDate <= endOfWeek;
    }).length;
    
    // 상태별 카운트
    const plannedCount = allTasks.filter(task => task.status === 'planned').length;
    const progressCount = allTasks.filter(task => task.status === 'in_progress').length;
    const completedCount = allTasks.filter(task => task.status === 'completed').length;
    
    // DOM 업데이트
    document.getElementById('today-count').textContent = todayCount;
    document.getElementById('tomorrow-count').textContent = tomorrowCount;
    document.getElementById('week-count').textContent = weekCount;
    document.getElementById('all-count').textContent = allTasks.length;
    document.getElementById('planned-count').textContent = plannedCount;
    document.getElementById('progress-count').textContent = progressCount;
    document.getElementById('completed-count').textContent = completedCount;
    
    // 과목별 필터 업데이트
    updateSubjectFilters();
}

// 과목별 필터 업데이트
function updateSubjectFilters() {
    const subjects = [...new Set(allTasks.map(task => task.subject).filter(Boolean))];
    const subjectFiltersContainer = document.getElementById('subject-filters');
    
    subjectFiltersContainer.innerHTML = subjects.map(subject => {
        const count = allTasks.filter(task => task.subject === subject).length;
        return `
            <div class="filter-item" data-filter="${subject}">
                <span>${subject}</span>
                <span class="filter-count">${count}</span>
            </div>
        `;
    }).join('');
    
    // 새로 생성된 과목 필터에 이벤트 리스너 추가
    subjectFiltersContainer.querySelectorAll('.filter-item').forEach(item => {
        item.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            setActiveFilter(filter);
            applyFilter(filter);
        });
    });
}

// 할 일 추가 모달 열기
function openAddTaskModal() {
    editingTaskId = null;
    document.getElementById('modal-title').textContent = '새 할 일 추가';
    document.getElementById('delete-btn').style.display = 'none';
    
    // 폼 초기화
    document.getElementById('task-form').reset();
    
    // 기본값 설정
    const today = new Date();
    document.getElementById('task-date').value = today.toISOString().split('T')[0];
    
    document.getElementById('task-modal').style.display = 'block';
}

// 할 일 수정 모달 열기
function openEditTaskModal(taskId) {
    const task = allTasks.find(t => t.id === taskId);
    if (!task) return;
    
    editingTaskId = taskId;
    document.getElementById('modal-title').textContent = '할 일 수정';
    document.getElementById('delete-btn').style.display = 'block';
    
    // 폼에 기존 데이터 채우기
    document.getElementById('task-title').value = task.title || '';
    document.getElementById('task-description').value = task.description || '';
    document.getElementById('task-date').value = task.plan_date || '';
    document.getElementById('task-start-time').value = task.start_time || '';
    document.getElementById('task-end-time').value = task.end_time || '';
    document.getElementById('task-subject').value = task.subject || '';
    document.getElementById('task-priority').value = task.priority || 'medium';
    document.getElementById('task-status').value = task.status || 'planned';
    
    document.getElementById('task-modal').style.display = 'block';
}

// 모달 닫기
function closeTaskModal() {
    document.getElementById('task-modal').style.display = 'none';
    editingTaskId = null;
}

// 폼 제출 처리
document.getElementById('task-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const taskData = {
        title: document.getElementById('task-title').value,
        description: document.getElementById('task-description').value,
        plan_date: document.getElementById('task-date').value,
        start_time: document.getElementById('task-start-time').value || null,
        end_time: document.getElementById('task-end-time').value || null,
        subject: document.getElementById('task-subject').value || null,
        priority: document.getElementById('task-priority').value,
        status: document.getElementById('task-status').value
    };
    
    if (editingTaskId) {
        updateTask(editingTaskId, taskData);
    } else {
        addTask(taskData);
    }
});

// 날짜 네비게이션
function previousDay() {
    currentDate.setDate(currentDate.getDate() - 1);
    updateCurrentDate();
}

function nextDay() {
    currentDate.setDate(currentDate.getDate() + 1);
    updateCurrentDate();
}

// 모달 외부 클릭 시 닫기
window.addEventListener('click', function(event) {
    const modal = document.getElementById('task-modal');
    if (event.target === modal) {
        closeTaskModal();
    }
});

// 알림 표시
function showNotification(message, type = 'info') {
    // 기존 알림 제거
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // 애니메이션을 위해 약간의 지연
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // 3초 후 자동 제거
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 3000);
}
