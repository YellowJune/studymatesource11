# StudyMate 카카오톡 챗봇

StudyMate는 학습을 도와주는 카카오톡 챗봇입니다. 사진으로 문제를 보내면 AI가 풀이를 제공하고, TodoMate 스타일의 개인별 스터디 플래너를 제공합니다.

## 주요 기능

### 1. 📸 사진 문제풀이
- 카카오톡에서 문제 사진을 전송하면 AI가 자동으로 문제를 인식
- OpenAI GPT-4 Vision을 활용한 정확한 문제 분석
- 단계별 상세 풀이 제공
- 수학, 과학, 영어 등 다양한 과목 지원

### 2. 📅 스터디 플래너 (TodoMate 스타일)
- 개인별 할 일 관리 시스템
- 날짜별, 과목별, 우선순위별 필터링
- 실시간 진행률 및 통계 표시
- 직관적이고 깔끔한 웹 인터페이스
- 모바일 반응형 디자인

## 시스템 구조

```
studymate-chatbot/
├── src/
│   ├── main.py              # Flask 메인 애플리케이션
│   ├── routes/
│   │   ├── chatbot.py       # 카카오톡 웹훅 처리
│   │   ├── planner.py       # 플래너 API
│   │   └── user.py          # 사용자 관리
│   ├── models/
│   │   ├── user.py          # 사용자 모델
│   │   └── planner.py       # 플래너 모델
│   ├── static/
│   │   ├── index.html       # 플래너 웹 인터페이스
│   │   └── todomate.js      # 프론트엔드 로직
│   └── database/
│       └── app.db           # SQLite 데이터베이스
├── venv/                    # Python 가상환경
├── requirements.txt         # 의존성 패키지
└── README.md               # 이 파일
```

## 설치 및 설정

### 1. 환경 요구사항
- Python 3.11+
- OpenAI API 키
- 카카오 비즈니스 채널

### 2. 프로젝트 설치
```bash
# 프로젝트 클론 또는 다운로드
cd studymate-chatbot

# 가상환경 활성화
source venv/bin/activate

# 의존성 설치
pip install -r requirements.txt
```

### 3. 환경 변수 설정
```bash
# OpenAI API 키 설정
export OPENAI_API_KEY="your-openai-api-key"
export OPENAI_API_BASE="https://api.openai.com/v1"
```

### 4. 서버 실행
```bash
python src/main.py
```

서버가 실행되면 다음 주소에서 접근 가능합니다:
- 플래너 웹 인터페이스: `http://localhost:5002`
- 카카오톡 웹훅: `http://localhost:5002/kakao/webhook`

## 카카오톡 채널 설정

### 1. 카카오 비즈니스 채널 생성
1. [카카오 비즈니스](https://business.kakao.com/)에 접속
2. 새 채널 생성 (채널명: studymate)
3. 채널 관리 > 챗봇 설정으로 이동

### 2. 웹훅 URL 설정
```
웹훅 URL: https://your-domain.com/kakao/webhook
```

### 3. 봇 버튼 설정
카카오톡 채널에서 다음 버튼들을 설정하세요:

**버튼 1: 문제풀이**
- 버튼명: "📸 문제풀이"
- 액션: 이미지 업로드 요청

**버튼 2: 스터디 플래너**
- 버튼명: "📅 스터디 플래너"
- 액션: 웹 링크
- URL: `https://your-domain.com/planner/{user_id}`

## API 엔드포인트

### 카카오톡 웹훅
- `POST /kakao/webhook` - 카카오톡 메시지 수신 및 처리

### 플래너 API
- `GET /api/planner/plans/{user_id}` - 사용자 할 일 목록 조회
- `POST /api/planner/plans` - 새 할 일 추가
- `PUT /api/planner/plans/{plan_id}` - 할 일 수정
- `DELETE /api/planner/plans/{plan_id}` - 할 일 삭제
- `PATCH /api/planner/plans/{plan_id}/status` - 할 일 상태 변경

### 사용자 API
- `GET /api/users` - 사용자 목록 조회
- `POST /api/users` - 새 사용자 생성

## 배포 가이드

### 1. 서버 배포
```bash
# 프로덕션 서버에서
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5002 src.main:app
```

### 2. 도메인 설정
- 도메인을 서버 IP에 연결
- HTTPS 인증서 설정 (Let's Encrypt 권장)
- 카카오톡 웹훅 URL을 HTTPS로 업데이트

### 3. 환경 변수 설정
```bash
# 프로덕션 환경에서
export FLASK_ENV=production
export OPENAI_API_KEY="your-openai-api-key"
```

## 사용법

### 문제풀이 기능
1. 카카오톡에서 StudyMate 채널 추가
2. "📸 문제풀이" 버튼 클릭
3. 문제 사진 업로드
4. AI가 자동으로 문제를 분석하고 풀이 제공

### 스터디 플래너 기능
1. "📅 스터디 플래너" 버튼 클릭
2. 웹 인터페이스에서 할 일 관리
3. 날짜별, 과목별 필터링 활용
4. 체크박스로 완료 상태 관리

## 문제 해결

### 자주 발생하는 문제

**1. OpenAI API 오류**
- API 키가 올바른지 확인
- API 사용량 한도 확인
- 네트워크 연결 상태 확인

**2. 카카오톡 웹훅 오류**
- 웹훅 URL이 HTTPS인지 확인
- 서버가 정상 실행 중인지 확인
- 방화벽 설정 확인

**3. 데이터베이스 오류**
- SQLite 파일 권한 확인
- 디스크 용량 확인

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 지원

문제가 발생하거나 기능 개선 제안이 있으시면 이슈를 등록해 주세요.



## 깃허브 배포 후 카카오톡 연동 가이드

깃허브에 프로젝트를 성공적으로 업로드하셨다면, 이제 이 프로젝트를 웹 서버에 배포하고 카카오톡 채널과 연동해야 합니다. 이 과정은 크게 다음 단계로 나뉩니다.

### 1. 클라우드 플랫폼 선택 및 서버 배포

StudyMate 챗봇은 Flask 기반의 웹 애플리케이션이므로, 이를 호스팅할 수 있는 클라우드 플랫폼이 필요합니다. 도메인 연결을 지원하는 주요 클라우드 플랫폼은 다음과 같습니다.

*   **AWS (Amazon Web Services):** EC2, Elastic Beanstalk, Lambda 등 다양한 서비스를 통해 유연하게 배포할 수 있습니다. EC2는 가상 서버를 직접 관리하는 방식이며, Elastic Beanstalk은 애플리케이션 배포를 자동화해줍니다. Lambda는 서버리스 방식으로, 사용량에 따라 비용을 지불합니다.
*   **Google Cloud Platform (GCP):** Compute Engine, App Engine, Cloud Run 등을 제공합니다. App Engine은 PaaS(Platform as a Service) 형태로 Flask 앱 배포에 적합하며, Cloud Run은 컨테이너 기반의 서버리스 배포를 지원합니다.
*   **Microsoft Azure:** Virtual Machines, App Service 등을 통해 배포할 수 있습니다. App Service는 웹 앱 호스팅에 최적화된 서비스입니다.
*   **Heroku:** PaaS 형태로, Git 푸시만으로 쉽게 배포할 수 있어 개발자들에게 인기가 많습니다. 무료 티어가 있지만, 지속적인 사용을 위해서는 유료 플랜이 필요할 수 있습니다.
*   **Vercel:** 주로 프론트엔드 애플리케이션 배포에 강점을 가지지만, 서버리스 함수를 통해 간단한 백엔드도 배포할 수 있습니다. Flask 앱 전체를 호스팅하기에는 적합하지 않을 수 있습니다.

**일반적인 배포 과정:**

1.  **클라우드 플랫폼 계정 생성 및 설정:** 선택한 클라우드 플랫폼에 가입하고 필요한 초기 설정을 완료합니다.
2.  **가상 환경 또는 컨테이너 설정:** Flask 애플리케이션을 실행할 서버 환경을 구성합니다. Docker를 사용하여 컨테이너화하면 배포가 더욱 용이합니다.
3.  **코드 배포:** 깃허브 저장소의 코드를 클라우드 서버로 가져와 배포합니다. Git 연동, CI/CD 파이프라인 구축 등을 활용할 수 있습니다.
4.  **환경 변수 설정:** `OPENAI_API_KEY`와 같은 민감한 정보는 코드에 직접 포함하지 않고, 클라우드 플랫폼의 환경 변수 관리 기능을 통해 설정합니다.
5.  **애플리케이션 실행:** Gunicorn, uWSGI와 같은 WSGI 서버를 사용하여 Flask 애플리케이션을 실행합니다.

### 2. 도메인 연결 및 HTTPS 설정

카카오톡 웹훅은 반드시 HTTPS를 사용해야 하므로, 도메인 연결과 SSL/TLS 인증서 설정이 필수적입니다.

1.  **도메인 구매:** GoDaddy, Namecheap, Gabia 등에서 원하는 도메인을 구매합니다.
2.  **DNS 설정:** 구매한 도메인을 클라우드 플랫폼의 서버 IP 주소와 연결합니다. A 레코드, CNAME 레코드 등을 설정합니다.
3.  **SSL/TLS 인증서 발급 및 적용:** Let's Encrypt와 같은 무료 인증서 발급 서비스를 이용하거나, 클라우드 플랫폼에서 제공하는 SSL/TLS 기능을 활용하여 HTTPS를 설정합니다. 이를 통해 데이터 암호화 및 보안을 강화할 수 있습니다.

### 3. 카카오톡 채널 웹훅 URL 업데이트

서버 배포 및 도메인, HTTPS 설정이 완료되면, 카카오 비즈니스 채널 설정에서 웹훅 URL을 업데이트해야 합니다.

1.  **카카오 비즈니스 관리자 센터 접속:** [https://business.kakao.com/](https://business.kakao.com/) 에 로그인합니다.
2.  **채널 관리 > 챗봇 메뉴 이동:** 이전에 설정했던 챗봇 설정 페이지로 이동합니다.
3.  **웹훅 URL 변경:** `https://your-domain.com/kakao/webhook` 와 같이 실제 배포된 서버의 도메인 주소로 웹훅 URL을 변경합니다.
4.  **봇 버튼 URL 업데이트:** 스터디 플래너 버튼의 웹 링크 URL도 `https://your-domain.com/planner/{user_id}` 와 같이 변경된 도메인으로 업데이트합니다.

이 과정을 통해 깃허브에 있는 StudyMate 챗봇 프로젝트를 실제 서비스 가능한 형태로 배포하고 카카오톡 채널과 완벽하게 연동할 수 있습니다.

특정 클라우드 플랫폼(예: AWS EC2, Heroku 등)을 선택하시면, 해당 플랫폼에 맞는 더 상세한 배포 및 연동 가이드를 제공해 드릴 수 있습니다.



## Vercel 배포 가이드

Vercel은 주로 정적 웹사이트 및 서버리스 함수 배포에 최적화된 플랫폼입니다. Python 기반의 Flask 애플리케이션을 Vercel에 배포하려면 몇 가지 특별한 설정이 필요합니다. Flask 앱의 각 라우트를 서버리스 함수로 변환하여 배포하는 방식을 사용해야 합니다.

### 1. 프로젝트 구조 변경

Flask 애플리케이션을 Vercel에 배포하기 위해서는 프로젝트 구조를 Vercel의 요구사항에 맞게 변경해야 합니다. `api` 디렉토리를 생성하고 그 안에 Flask 앱의 진입점 역할을 할 파일을 생성합니다. 예를 들어, `api/index.py` 파일을 생성하고 다음과 같이 Flask 앱을 초기화합니다.

```python
# api/index.py

from flask import Flask, request, jsonify
from flask_cors import CORS
from src.routes.chatbot import chatbot_bp
from src.routes.planner import planner_bp
from src.models.user import db as user_db, User
from src.models.planner import db as planner_db, StudyPlan

app = Flask(__name__)
CORS(app)

# 데이터베이스 설정
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///./src/database/app.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

user_db.init_app(app)
planner_db.init_app(app)

# Blueprint 등록
app.register_blueprint(chatbot_bp, url_prefix="/chatbot")
app.register_blueprint(planner_bp, url_prefix="/api")

@app.route("/")
def home():
    return "StudyMate KakaoTalk Chatbot Backend"

# 데이터베이스 초기화 (Vercel 배포 시에는 빌드 스크립트에서 처리)
with app.app_context():
    user_db.create_all()
    planner_db.create_all()

# Vercel에서 Flask 앱을 실행하기 위한 진입점
# Vercel은 이 `app` 객체를 사용하여 서버리스 함수를 생성합니다.
```

### 2. `vercel.json` 파일 생성

프로젝트 루트 디렉토리에 `vercel.json` 파일을 생성하여 Vercel의 빌드 및 배포 설정을 정의합니다.

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.py",
      "use": "@vercel/python"
    },
    {
      "src": "src/static/**",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/chatbot/(.*)",
      "dest": "api/index.py"
    },
    {
      "src": "/api/(.*)",
      "dest": "api/index.py"
    },
    {
      "src": "/(.*)",
      "dest": "src/static/index.html"
    }
  ]
}
```

- `builds`: `api/index.py` 파일을 `@vercel/python` 런타임을 사용하여 빌드하고, `src/static` 디렉토리의 모든 정적 파일은 `@vercel/static` 런타임을 사용하여 빌드하도록 설정합니다.
- `routes`: 들어오는 요청을 적절한 빌드로 라우팅합니다. `/chatbot` 및 `/api` 경로로 들어오는 요청은 `api/index.py` (Flask 앱)로 라우팅되고, 그 외의 모든 요청은 `src/static/index.html` (정적 웹 페이지)로 라우팅됩니다.

### 3. `requirements.txt` 업데이트

`api/index.py`에서 필요한 모든 라이브러리가 `requirements.txt`에 포함되어 있는지 확인합니다. 특히 `flask`, `flask-cors`, `SQLAlchemy`, `openai`, `pillow`, `requests`, `python-dateutil` 등이 포함되어야 합니다.

```bash
pip freeze > requirements.txt
```

### 4. Vercel 환경 변수 설정

OpenAI API 키와 같은 민감한 정보는 Vercel 대시보드에서 환경 변수로 설정해야 합니다. 프로젝트 설정 -> Environment Variables 섹션에서 `OPENAI_API_KEY`를 추가합니다.

### 5. 배포

프로젝트를 GitHub 저장소에 푸시한 후, Vercel 대시보드에서 해당 저장소를 임포트하여 배포를 시작합니다. Vercel은 `vercel.json` 파일을 자동으로 감지하고 설정에 따라 프로젝트를 빌드하고 배포합니다.

### 6. 카카오톡 웹훅 URL 설정

Vercel 배포가 완료되면, Vercel에서 제공하는 배포 URL (예: `https://your-project-name.vercel.app`)을 카카오톡 채널의 웹훅 URL로 설정해야 합니다. 이때, 챗봇 라우트의 경로를 포함해야 합니다. 예를 들어, `https://your-project-name.vercel.app/chatbot` 과 같이 설정합니다.

### 주의사항

- **데이터베이스**: Vercel은 서버리스 환경이므로, SQLite와 같은 파일 기반 데이터베이스는 각 함수 호출마다 초기화될 수 있습니다. 영구적인 데이터 저장이 필요하다면 PostgreSQL, MongoDB 등 외부 데이터베이스 서비스를 이용해야 합니다. 현재 구현된 SQLite 데이터베이스는 Vercel 환경에서 영구적인 데이터 저장에 적합하지 않을 수 있습니다.
- **콜드 스타트**: 서버리스 함수는 일정 시간 동안 요청이 없으면 비활성화됩니다. 첫 요청 시에는 콜드 스타트(Cold Start)로 인해 응답 시간이 지연될 수 있습니다.

이 가이드를 통해 Vercel에 Flask 기반의 챗봇을 배포하는 데 도움이 되기를 바랍니다. 데이터베이스 영속성이 중요하다면, 외부 데이터베이스 서비스 연동을 고려해야 합니다.



## 추천 배포 플랫폼

Flask와 같은 Python 백엔드 애플리케이션을 안정적으로 운영하고 도메인을 연결하기에 적합한 클라우드 플랫폼은 다음과 같습니다.

### 1. AWS (Amazon Web Services)

**장점:**
- **가장 광범위한 서비스:** EC2 (가상 서버), RDS (관계형 데이터베이스), S3 (객체 스토리지), Lambda (서버리스 함수) 등 매우 다양한 서비스를 제공하여 유연한 아키텍처 구성이 가능합니다.
- **높은 확장성 및 안정성:** 대규모 트래픽 처리 및 고가용성 아키텍처 구축에 용이합니다.
- **무료 티어:** 일정 기간 또는 특정 사용량까지 무료로 사용할 수 있는 서비스가 많아 초기 개발 비용 부담이 적습니다.

**단점:**
- **복잡성:** 서비스 종류가 많고 설정이 복잡하여 초보자가 학습하기 어려울 수 있습니다.
- **비용 관리:** 사용량에 따라 비용이 발생하므로, 비용 관리에 주의가 필요합니다.

**Flask 배포 추천 서비스:**
- **AWS EC2:** 가상 서버에 직접 Flask 앱을 배포하고 운영하는 방식입니다. 가장 일반적이고 유연합니다.
- **AWS Elastic Beanstalk:** Flask 앱 배포를 자동화하고 관리해주는 서비스입니다. 설정이 비교적 간단합니다.
- **AWS Lambda + API Gateway:** Flask 앱을 서버리스 함수로 변환하여 배포하는 방식입니다. 사용량에 따라 비용이 발생하며, 트래픽이 적을 때 효율적입니다.

### 2. Google Cloud Platform (GCP)

**장점:**
- **간편한 사용성:** AWS에 비해 상대적으로 직관적인 UI와 쉬운 설정 과정을 제공합니다.
- **강력한 데이터 분석 및 AI 서비스:** Google의 핵심 기술인 데이터 분석 및 머신러닝 서비스와 연동이 용이합니다.
- **무료 티어:** AWS와 유사하게 무료 티어를 제공합니다.

**단점:**
- **AWS보다 적은 서비스:** AWS만큼 서비스 종류가 다양하지는 않습니다.

**Flask 배포 추천 서비스:**
- **Google Compute Engine (GCE):** AWS EC2와 유사한 가상 서버 서비스입니다.
- **Google App Engine (GAE):** Flask 앱을 PaaS (Platform as a Service) 형태로 배포할 수 있습니다. 설정이 간단하고 자동 확장이 가능합니다.
- **Cloud Run:** 컨테이너화된 애플리케이션을 서버리스 환경에서 실행할 수 있습니다. 유연성과 서버리스의 장점을 결합합니다.

### 3. Microsoft Azure

**장점:**
- **Microsoft 생태계 통합:** Microsoft 제품 및 서비스와 긴밀하게 통합됩니다.
- **하이브리드 클라우드:** 온프레미스 환경과의 연동이 강점입니다.

**단점:**
- **복잡성:** AWS와 유사하게 서비스 종류가 많고 설정이 복잡할 수 있습니다.

**Flask 배포 추천 서비스:**
- **Azure App Service:** 웹 앱, API 앱, 모바일 앱 등을 호스팅할 수 있는 PaaS 서비스입니다. Flask 앱 배포에 적합합니다.
- **Azure Virtual Machines:** 가상 서버에 직접 Flask 앱을 배포하고 운영하는 방식입니다.

### 4. Heroku

**장점:**
- **개발자 친화적:** 배포 과정이 매우 간단하고 직관적입니다. Git 푸시만으로 배포가 가능합니다.
- **관리 용이성:** 인프라 관리에 대한 부담이 적습니다.
- **무료 티어:** 소규모 프로젝트를 위한 무료 티어를 제공합니다.

**단점:**
- **제한된 유연성:** 세부적인 인프라 설정에 대한 제약이 있습니다.
- **비용:** 대규모 프로젝트로 확장 시 다른 클라우드 플랫폼에 비해 비용이 비쌀 수 있습니다.

**Flask 배포 추천 서비스:**
- **Heroku Dynos:** Flask 앱을 실행하는 컨테이너입니다. 웹 앱 배포에 가장 적합합니다.

### 어떤 플랫폼을 선택해야 할까요?

- **초보자이거나 빠른 배포를 원한다면:** **Heroku** 또는 **Google App Engine (GAE)** 이 좋습니다. 설정이 간단하고 관리 부담이 적습니다.
- **유연성과 확장성이 중요하고 클라우드 학습에 투자할 의향이 있다면:** **AWS (EC2 또는 Elastic Beanstalk)** 또는 **GCP (Compute Engine 또는 App Engine)** 를 추천합니다. 이들은 장기적으로 더 많은 가능성을 제공합니다.
- **서버리스 아키텍처에 관심이 있다면:** **AWS Lambda + API Gateway** 또는 **GCP Cloud Run**을 고려해볼 수 있습니다. 하지만 Flask 앱을 서버리스에 맞게 재구성해야 할 수 있습니다.

어떤 플랫폼이 가장 적합하다고 생각하시나요? 선택하시면 해당 플랫폼에 대한 더 상세한 배포 가이드를 제공해 드리겠습니다.

