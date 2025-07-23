📊 Rockview
Rockview is a Church Attendance Report Aggregation Web Application built for House on The Rock to monitor and manage weekly attendance for events and services at CITH (Church in the House) centers.

This platform enables seamless reporting and approval workflows across multiple church leadership levels — from CITH Centers up to District Pastors — ensuring accuracy, accountability, and clarity in weekly attendance data.

🚀 Features
✅ CITH Center Reports: Submit attendance for weekly events and services.

🔄 Approval Workflow: Reports pass through Area Supervisor ➡️ Zonal Supervisor ➡️ District Pastor.

🔍 Review & Feedback: Supervisors can approve or reject reports with reasons.

🧾 Historical Records: Keep track of weekly attendance over time.

🔐 Role-based Access: Access permissions tailored to your church position.

📈 Analytics Dashboard (Coming Soon): Get insights across zones, districts, and more.

🏛️ Leadership Hierarchy & Workflow
CITH Center Admins

Submit weekly attendance reports for all services/events.

Area Supervisors

Review, approve, or reject submitted reports.

Zonal Supervisors

Review reports approved by Area Supervisors.

District Pastors

Final review and archiving of approved reports.

Each level ensures data integrity before passing it up the chain.

🧰 Tech Stack
This project is proudly built with the MERN stack and TypeScript for type safety and developer joy:

MongoDB – NoSQL Database for report storage and user roles

Express.js – Backend API framework

React – Frontend UI

Node.js – Backend runtime

TypeScript – Strong typing across both frontend and backend

Tailwind CSS – (Optional, if used) for styling

🧪 Local Setup
Prerequisites
Node.js v18+

MongoDB instance

Yarn or npm

Clone and Run
bash
Copy code
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
The frontend will usually run on http://localhost:5173 and backend on http://localhost:5000.

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
You can deploy to platforms like:

Frontend: Vercel / Netlify

Backend: Render / Railway / Heroku

Database: MongoDB Atlas

Make sure to set environment variables like MONGO_URI, JWT_SECRET, etc.

✝️ Purpose & Impact
Rockview helps foster accountability and transparency within the House on The Rock leadership ecosystem. It supports growth tracking, pastoral oversight, and ensures CITH centers are active and healthy, spiritually and structurally.

🤝 Contributions
This project is currently maintained by Brendan Mebuge Kamsiyochukwu, but contributions are welcome if you'd like to collaborate or expand the features for broader church use!

📧 Contact
For suggestions, issues, or collaboration:
Email: brendanmebson@gmail.com

🙏 Acknowledgements
To House on The Rock and all the amazing leaders serving diligently across CITHs. This tool was created to support your commitment to building strong spiritual communities!
