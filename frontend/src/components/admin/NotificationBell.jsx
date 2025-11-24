import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../../utils/config";

export default function NotificationBell() {
  const token = localStorage.getItem("token");
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const loadNotifications = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(res.data);
    } catch (err) {
      console.error("NOTIFICATION ERROR:", err);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  return (
    <div className="notification-wrapper">
      <div className="notif-icon" onClick={() => setOpen(!open)}>
        🔔
        {notifications.length > 0 && (
          <span className="notif-count">{notifications.length}</span>
        )}
      </div>

      {open && (
        <div className="notif-dropdown">
          {notifications.length === 0 ? (
            <div className="notif-empty">No notifications</div>
          ) : (
            notifications.map((note) => (
              <div key={note._id} className="notif-item">
                <strong>{note.title}</strong>
                <p>{note.message}</p>
                <span className="notif-time">
                  {new Date(note.createdAt).toLocaleString()}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
