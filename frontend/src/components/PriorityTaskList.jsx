import React, {useState} from "react"
import {formatDueDate, sortedTaskList} from "../api"

export function PriorityTaskList(props) {
  const [collapsed, setCollapsed] = useState(false)

  const handleCollapse = () => {setCollapsed(!collapsed)}

  return collapsed ?
    (<div>
      <button onClick={handleCollapse} className="btn-secondary">Show</button>
    </div>) :
    (
      <div>
        <button onClick={handleCollapse} className="btn-secondary btn-collapse-expanded">Hide</button>
        {sortedTaskList(props.taskList.tasks, props.method, props.reverse).map((task, index) => {
          const dueInfo = formatDueDate(task.due_date)
          return (
            <div
              key={task.id}
              className={`recommendation-card ${task.is_completed ? 'completed' : ''}`}
            >
              <div className="recommendation-rank">
                <span className="rank-number">{index + 1}</span>
              </div>

              <div className="recommendation-checkbox">
                <input
                  type="checkbox"
                  checked={task.is_completed}
                  onChange={() => props.handleComplete(task.id, !task.is_completed)}
                />
              </div>

              <div className="recommendation-content">
                <div className="recommendation-header">
                  <h3 className="recommendation-title">{task.title}</h3>
                  <span className={`task-priority ${props.getPriorityClass(task.priority)}`}>
                            {task.priority}
                          </span>
                </div>

                <div className="recommendation-meta">
                  {task.course_name && (
                    <span
                      className="task-course"
                      style={{backgroundColor: task.course_color || '#4a90a4'}}
                    >
                            {task.course_name}
                          </span>
                  )}
                  <span className={`task-due ${dueInfo.urgent ? 'urgent' : ''}`}>
                            {dueInfo.text}
                          </span>
                  {task.duration && (
                    <span className="task-duration">{task.duration} min</span>
                  )}
                </div>
              </div>

              <div className="recommendation-score">
                <span className="score-value">{task.score?.toFixed(1)}</span>
                <span className="score-label">{props.getScoreLabel(task.score)}</span>
              </div>
            </div>
          )
        })}
      </div>
    )
}