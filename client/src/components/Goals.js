import React from 'react';
import './Goals.css';

function Goals({ goals, onEdit, onDelete, isOwnProfile }) {
    if (!goals || goals.length === 0) {
        return null;
    }

    const getGoalLabel = (goal) => {
        const timeframeLabels = {
            'week': 'this week',
            'month': 'this month',
            'year': 'this year',
            'all-time': 'all time'
        };

        const typeLabel = goal.type === 'books' ? 'books' : 'pages';
        return `Read ${goal.targetValue} ${typeLabel} ${timeframeLabels[goal.timeframe]}`;
    };

    return (
        <div className="goals-container">
            <h3>Reading Goals</h3>
            <div className="goals-list">
                {goals.map((goal) => (
                    <div key={goal._id} className="goal-card">
                        <div className="goal-header">
                            <h4>{getGoalLabel(goal)}</h4>
                            {isOwnProfile && (
                                <div className="goal-actions">
                                    <button
                                        onClick={() => onDelete(goal._id)}
                                        className="btn-delete-goal"
                                        title="Delete goal"
                                    >
                                        ✕
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="goal-progress-container">
                            <div className="goal-progress-bar">
                                <div
                                    className="goal-progress-fill"
                                    style={{ width: `${goal.progress}%` }}
                                />
                            </div>
                            <div className="goal-stats">
                                <span className="goal-current">{goal.currentValue}</span>
                                <span className="goal-separator">/</span>
                                <span className="goal-target">{goal.targetValue}</span>
                                <span className="goal-percentage">({goal.progress}%)</span>
                            </div>
                        </div>

                        {goal.progress >= 100 && (
                            <div className="goal-completed">
                                ♥ Goal completed!
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Goals;