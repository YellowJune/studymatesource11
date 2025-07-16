// 전역 변수
let currentUserId = 1; // 기본 사용자 ID (실제로는 URL에서 추출)
let allTasks = [];
let filteredTasks = [];
let currentFilter = 'today';
let currentDate = new Date();
let editingTaskId = null;

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    // URL에서 사용자 ID 추출
    const pathParts = window.location.pathname.split('/');
    if (pathParts.includes('planner') && pathParts[pathParts.indexOf('planner') + 1]) {
        currentUserId = parseInt(pathParts[pathParts.indexOf('planner') + 1]);
    }
    
    initializeApp();
    setupEventListeners();
});

// 앱 초기화
function initializeApp() {
    updateCurrentDate();
    loadTasks();
    setupFilters();
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

// 이전 날짜로 이동
function previousDay() {
    currentDate.setDate(currentDate.getDate() - 1);
    updateCurrentDate();
    if (currentFilter === 'today') {
        applyFilter('today');
    }
}

// 다음 날짜로 이동
function nextDay() {
    currentDate.setDate(currentDate.getDate() + 1);
    updateCurrentDate();
    if (currentFilter === 'today') {
        applyFilter('today');
    }
}

// 활성 필터 설정
function setActiveFilter(filter) {
    document.querySelectorAll('.filter-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const filterElement = document.querySelector(`[data-filter="${filter}"]`);
    if (filterElement) {
        filterElement.classList.add('active');
    }
    
    currentFilter = filter;
}

// 필터 적용
function applyFilter(filter) {
    const today = formatDate(new Date());
    const tomorrow = formatDate(new Date(Date.now() + 24 * 60 * 60 * 1000));
    const weekStart = getWeekStart(new Date());
    const weekEnd = getWeekEnd(new Date());
    
    switch (filter) {
        case 'today':
            const targetDate = formatDate(currentDate);
            filteredTasks = allTasks.filter(task => task.plan_date === targetDate);
            break;
        case 'tomorrow':
            filteredTasks = allTasks.filter(task => task.plan_date === tomorrow);
            break;
        case 'week':
            filteredTasks = allTasks.filter(task => 
                task.plan_date >= weekStart && task.plan_date <= weekEnd
            );
            break;
        case 'all':
            filteredTasks = [...allTasks];
            break;
        case 'planned':
            filteredTasks = allTasks.filter(task => task.status === 'planned');
            break;
        case 'in_progress':
            filteredTasks = allTasks.filter(task => task.status === 'in_progress');
            break;
        case 'completed':
            filteredTasks = allTasks.filter(task => task.status === 'completed');
            break;
        default:
            // 과목별 필터
            filteredTasks = allTasks.filter(task => task.subject === filter);
    }
    
    renderTasks();
    updateFilterCounts();
}

// 주 시작일 계산
function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return formatDate(new Date(d.setDate(diff)));
}

// 주 종료일 계산
function getWeekEnd(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + 6;
    return formatDate(new Date(d.setDate(diff)));
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
    
    // 우선순위와 날짜로 정렬
    const sortedTasks = [...filteredTasks].sort((a, b) => {
        // 완료된 항목은 아래로
        if (a.status === 'completed' && b.status !== 'completed') return 1;
        if (a.status !== 'completed' && b.status === 'completed') return -1;
        
        // 우선순위 정렬
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        
        // 날짜 정렬
        if (a.plan_date !== b.plan_date) {
            return a.plan_date.localeCompare(b.plan_date);
        }
        
        // 시간 정렬
        if (a.start_time && b.start_time) {
            return a.start_time.localeCompare(b.start_time);
        }
        
        return 0;
    });
    
    taskList.innerHTML = sortedTasks.map(task => createTaskElement(task)).join('');
}

// 할 일 요소 생성
function createTaskElement(task) {
    const isCompleted = task.status === 'completed';
    const priorityClass = `priority-${task.priority}`;
    
    return `
        <div class="task-item ${task.priority} ${isCompleted ? 'completed' : ''}" onclick="editTask(${task.id})">
            <div class="task-checkbox ${isCompleted ? 'checked' : ''}" onclick="toggleTaskStatus(event, ${task.id})"></div>
            <div class="task-content">
                <div class="task-title">${escapeHtml(task.title)}</div>
                <div class="task-meta">
                    ${task.start_time ? `<div class="task-time">🕐 ${task.start_time}${task.end_time ? ` - ${task.end_time}` : ''}</div>` : ''}
                    ${task.subject ? `<div class="task-subject">${task.subject}</div>` : ''}
                    <div class="task-priority ${priorityClass}">${getPriorityText(task.priority)}</div>
                    ${task.plan_date !== formatDate(currentDate) ? `<div class="task-date">📅 ${formatDateKorean(task.plan_date)}</div>` : ''}
                </div>
            </div>
        </div>
    `;
}

// HTML 이스케이프
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 우선순위 텍스트 반환
function getPriorityText(priority) {
    const priorityMap = {
        high: '높음',
        medium: '보통',
        low: '낮음'
    };
    return priorityMap[priority] || '보통';
}

// 날짜 한국어 포맷
function formatDateKorean(dateStr) {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    
    if (formatDate(date) === formatDate(today)) {
        return '오늘';
    } else if (formatDate(date) === formatDate(tomorrow)) {
        return '내일';
    } else {
        return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
    }
}

// 할 일 상태 토글
function toggleTaskStatus(event, taskId) {
    event.stopPropagation();
    
    const task = allTasks.find(t => t.id === taskId);
    if (!task) return;
    
    const newStatus = task.status === 'completed' ? 'planned' : 'completed';
    
    updateTaskStatus(taskId, newStatus);
}

// 할 일 상태 업데이트
async function updateTaskStatus(taskId, status) {
    try {
        const response = await fetch(`/api/planner/plans/${taskId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // 로컬 데이터 업데이트
            const task = allTasks.find(t => t.id === taskId);
            if (task) {
                task.status = status;
            }
            
            applyFilter(currentFilter);
            updateHeaderStats();
            showNotification(
                status === 'completed' ? '할 일을 완료했습니다! 🎉' : '할 일을 미완료로 변경했습니다.',
                'success'
            );
        } else {
            showNotification('상태 변경에 실패했습니다: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('Error updating task status:', error);
        showNotification('상태 변경 중 오류가 발생했습니다.', 'error');
    }
}

// 할 일 추가 모달 열기
function openAddTaskModal() {
    editingTaskId = null;
    document.getElementById('modal-title').textContent = '새 할 일 추가';
    document.getElementById('task-form').reset();
    document.getElementById('delete-btn').style.display = 'none';
    
    // 현재 날짜로 기본값 설정
    document.getElementById('task-date').value = formatDate(currentDate);
    
    document.getElementById('task-modal').style.display = 'block';
}

// 할 일 수정
function editTask(taskId) {
    const task = allTasks.find(t => t.id === taskId);
    if (!task) return;
    
    editingTaskId = taskId;
    document.getElementById('modal-title').textContent = '할 일 수정';
    document.getElementById('delete-btn').style.display = 'block';
    
    document.getElementById('task-title').value = task.title;
    document.getElementById('task-description').value = task.description || '';
    document.getElementById('task-date').value = task.plan_date;
    document.getElementById('task-start-time').value = task.start_time || '';
    document.getElementById('task-end-time').value = task.end_time || '';
    document.getElementById('task-subject').value = task.subject || '';
    document.getElementById('task-priority').value = task.priority;
    document.getElementById('task-status').value = task.status;
    
    document.getElementById('task-modal').style.display = 'block';
}

// 모달 닫기
function closeTaskModal() {
    document.getElementById('task-modal').style.display = 'none';
    editingTaskId = null;
}

// 할 일 삭제
async function deleteTask() {
    if (!editingTaskId) return;
    
    if (!confirm('정말로 이 할 일을 삭제하시겠습니까?')) return;
    
    try {
        const response = await fetch(`/api/planner/plans/${editingTaskId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            closeTaskModal();
            loadTasks();
            showNotification('할 일이 삭제되었습니다.', 'success');
        } else {
            showNotification('삭제에 실패했습니다: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('Error deleting task:', error);
        showNotification('삭제 중 오류가 발생했습니다.', 'error');
    }
}

// 할 일 폼 제출
document.getElementById('task-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const taskData = {
        user_id: currentUserId,
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
        createTask(taskData);
    }
});

// 할 일 생성
async function createTask(taskData) {
    try {
        const response = await fetch('/api/planner/plans', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(taskData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            closeTaskModal();
            loadTasks();
            showNotification('새 할 일이 추가되었습니다! ✨', 'success');
        } else {
            showNotification('할 일 추가에 실패했습니다: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('Error creating task:', error);
        showNotification('할 일 추가 중 오류가 발생했습니다.', 'error');
    }
}

// 할 일 수정
async function updateTask(taskId, taskData) {
    try {
        const response = await fetch(`/api/planner/plans/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(taskData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            closeTaskModal();
            loadTasks();
            showNotification('할 일이 수정되었습니다! 📝', 'success');
        } else {
            showNotification('할 일 수정에 실패했습니다: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('Error updating task:', error);
        showNotification('할 일 수정 중 오류가 발생했습니다.', 'error');
    }
}

// 할 일 목록 로드
async function loadTasks() {
    try {
        // 현재 월의 모든 할 일 로드
        const year = new Date().getFullYear();
        const month = new Date().getMonth();
        const startDate = new Date(year, month - 1, 1); // 이전 달부터
        const endDate = new Date(year, month + 2, 0); // 다음 달까지
        
        const response = await fetch(
            `/api/planner/plans/${currentUserId}?start_date=${formatDate(startDate)}&end_date=${formatDate(endDate)}`
        );
        
        const result = await response.json();
        
        if (result.success) {
            allTasks = result.plans;
            applyFilter(currentFilter);
            updateHeaderStats();
            updateSubjectFilters();
        } else {
            console.error('Failed to load tasks:', result.error);
            showNotification('할 일 목록을 불러오는데 실패했습니다.', 'error');
        }
    } catch (error) {
        console.error('Error loading tasks:', error);
        showNotification('할 일 목록을 불러오는 중 오류가 발생했습니다.', 'error');
    }
}

// 헤더 통계 업데이트
function updateHeaderStats() {
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
    const today = formatDate(new Date());
    const tomorrow = formatDate(new Date(Date.now() + 24 * 60 * 60 * 1000));
    const weekStart = getWeekStart(new Date());
    const weekEnd = getWeekEnd(new Date());
    
    document.getElementById('today-count').textContent = 
        allTasks.filter(task => task.plan_date === today).length;
    
    document.getElementById('tomorrow-count').textContent = 
        allTasks.filter(task => task.plan_date === tomorrow).length;
    
    document.getElementById('week-count').textContent = 
        allTasks.filter(task => task.plan_date >= weekStart && task.plan_date <= weekEnd).length;
    
    document.getElementById('all-count').textContent = allTasks.length;
    
    document.getElementById('planned-count').textContent = 
        allTasks.filter(task => task.status === 'planned').length;
    
    document.getElementById('progress-count').textContent = 
        allTasks.filter(task => task.status === 'in_progress').length;
    
    document.getElementById('completed-count').textContent = 
        allTasks.filter(task => task.status === 'completed').length;
}

// 과목별 필터 업데이트
function updateSubjectFilters() {
    const subjects = [...new Set(allTasks.filter(task => task.subject).map(task => task.subject))];
    const container = document.getElementById('subject-filters');
    
    container.innerHTML = subjects.map(subject => {
        const count = allTasks.filter(task => task.subject === subject).length;
        return `
            <div class="filter-item" data-filter="${subject}">
                <span>${subject}</span>
                <span class="filter-count">${count}</span>
            </div>
        `;
    }).join('');
    
    // 새로 생성된 필터에 이벤트 리스너 추가
    container.querySelectorAll('.filter-item').forEach(item => {
        item.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            setActiveFilter(filter);
            applyFilter(filter);
        });
    });
}

// 필터 설정
function setupFilters() {
    updateFilterCounts();
}

// 날짜 포맷팅 (YYYY-MM-DD)
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 알림 표시
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // 애니메이션 효과
    setTimeout(() => notification.classList.add('show'), 100);
    
    // 3초 후 제거
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => document.body.removeChild(notification), 300);
    }, 3000);
}

// 모달 외부 클릭 시 닫기
window.onclick = function(event) {
    const modal = document.getElementById('task-modal');
    if (event.target === modal) {
        closeTaskModal();
    }
}

