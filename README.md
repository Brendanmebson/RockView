# 📊 Rockview

**Rockview** is a Church Attendance Report Aggregation Web Application built for **House on The Rock** to monitor and manage weekly attendance for events and services at **CITH (Church in the House)** centers.

This platform enables seamless reporting and approval workflows across multiple church leadership levels — from **CITH Centers** up to **District Pastors** — ensuring accuracy, accountability, and clarity in weekly attendance data.

---

## 🚀 Features

- ✅ **CITH Center Reports**: Submit attendance for weekly events and services.
- 🔄 **Approval Workflow**: Reports pass through Area Supervisor ➡️ Zonal Supervisor ➡️ District Pastor.
- 🔍 **Review & Feedback**: Supervisors can **approve** or **reject** reports with reasons.
- 🧾 **Historical Records**: Keep track of weekly attendance over time.
- 🔐 **Role-based Access**: Access permissions tailored to your church position.
- 📈 **Analytics Dashboard** *(Coming Soon)*: Get insights across zones, districts, and more.

---

## 🏛️ Leadership Hierarchy & Workflow

1. **CITH Center Admins**
   - Submit weekly attendance reports for all services/events.
2. **Area Supervisors**
   - Review, approve, or reject submitted reports.
3. **Zonal Supervisors**
   - Review reports approved by Area Supervisors.
4. **District Pastors**
   - Final review and archiving of approved reports.

Each level ensures data integrity before passing it up the chain.

---

## 🧰 Tech Stack

Built using the **MERN** stack with **TypeScript** for type safety and clean development:

- **MongoDB** – NoSQL Database for report storage and user roles
- **Express.js** – Backend API framework
- **React** – Frontend UI
- **Node.js** – Backend runtime
- **TypeScript** – Strong typing across both frontend and backend
- **Tailwind CSS** *(if used)* – Utility-first CSS framework for styling

---

## 🧪 Local Setup

### Prerequisites

- Node.js v18+
- MongoDB instance (local or cloud)
- Yarn or npm

### Clone and Run

```bash
git clone https://github.com/yourusername/rockview.git
cd rockview
Backend
bash
Copy code
cd server
npm install
npm run dev
Frontend
bash
Copy code
cd client
npm install
npm run dev
The frontend will run on http://localhost:5173

The backend will run on http://localhost:5000

🔐 User Roles
Role	Permissions
CITH Admin	Submit weekly attendance report
Area Supervisor	View & Approve/Reject CITH reports
Zonal Supervisor	View reports approved by Area Supervisor
District Pastor	Final approval & archive reports

📂 Folder Structure (Simplified)
bash
Copy code
rockview/
├── client/               # React + TS frontend
├── server/               # Node/Express + TS backend
├── README.md
└── .env.example
🌐 Deployment
Rockview can be deployed using:

Frontend: Vercel, Netlify

Backend: Render, Railway, Heroku

Database: MongoDB Atlas

Make sure to set environment variables like:

env
Copy code
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
PORT=5000
✝️ Purpose & Impact
Rockview helps foster accountability and transparency within the House on The Rock leadership ecosystem. It supports growth tracking, pastoral oversight, and ensures CITH centers are active and healthy — spiritually and structurally.

🤝 Contributions
This project is currently maintained by Brendan Mebuge Kamsiyochukwu, but contributions are welcome if you'd like to collaborate or expand the features for broader church use!

📧 Contact
For suggestions, issues, or collaboration:

📬 Email: brendanmebson@gmail.com

🙏 Acknowledgements
To House on The Rock and all the amazing leaders serving diligently across CITHs.
This tool was created to support your commitment to building strong spiritual communities!

Built with love, purpose, and TypeScript. ✨

python
Copy code

Let me know if you'd like badges (e.g., build passing, license, tech stack logos) or a sample `.env.example` file included too. You're doing something truly impactful here — rock on with Rockview! ⛪💻🔥
