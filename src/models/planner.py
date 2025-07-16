from src import db
from datetime import datetime

class StudyPlan(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(50), nullable=False)  # 문자열로 변경
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    plan_date = db.Column(db.Date, nullable=False)
    start_time = db.Column(db.Time, nullable=True)
    end_time = db.Column(db.Time, nullable=True)
    subject = db.Column(db.String(100), nullable=True)
    priority = db.Column(db.String(20), default=\'medium\')  # high, medium, low
    status = db.Column(db.String(20), default=\'planned\')  # planned, in_progress, completed, cancelled
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f\'\\<StudyPlan {self.title}>\'

    def to_dict(self):
        return {
            \'id\': self.id,
            \'user_id\': self.user_id,
            \'title\': self.title,
            \'description\': self.description,
            \'plan_date\': self.plan_date.isoformat() if self.plan_date else None,
            \'start_time\': self.start_time.strftime(\'%H:%M\') if self.start_time else None,
            \'end_time\': self.end_time.strftime(\'%H:%M\') if self.end_time else None,
            \'subject\': self.subject,
            \'priority\': self.priority,
            \'status\': self.status,
            \'created_at\': self.created_at.isoformat() if self.created_at else None,
            \'updated_at\': self.updated_at.isoformat() if self.updated_at else None
        }
