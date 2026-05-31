const Database = require('better-sqlite3');
const db = new Database('./portfolio.db');

// Clear existing projects
db.prepare('DELETE FROM projects').run();
console.log('Cleared existing projects from database.');

// Prepare statement
const insert = db.prepare(`
  INSERT INTO projects (title, description, full_desc, emoji, tags, github_url, linkedin_url, team, gradient, is_pinned)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const projects = [
  [
    'PerformAI',
    'High-performance AI model evaluation and visualization interface.',
    'A modern, high-performance web interface designed to benchmark, evaluate, and visualize performance metrics of various AI and machine learning models in real time.',
    '⚡',
    'JavaScript, AI Benchmarking, Web',
    'https://github.com/shivamishra12/PerformAI',
    '',
    'Shivam Mishra',
    'linear-gradient(135deg,#0f0c29,#302b63)',
    1
  ],
  [
    'Deep Learnings Modules',
    'Lab work and assignments implementing foundational deep learning models.',
    'This repository contains hands-on implementations of core deep learning algorithms, including CNNs, RNNs, and neural network tuning techniques, mapped to academic and research tasks.',
    '🧠',
    'Jupyter Notebook, Deep Learning, CNN, PyTorch',
    'https://github.com/shivamishra12/DEEP-LEARNINGS-MODULES',
    '',
    'Shivam Mishra',
    'linear-gradient(135deg,#1a1a2e,#16213e)',
    1
  ],
  [
    'MERN Lost & Found System',
    'Full-stack web application to report and track lost and found items.',
    'A complete full-stack web application built using the MERN stack (MongoDB, Express, React, Node.js) with production database integration to securely track, match, and recover lost assets.',
    '🔍',
    'React, Node.js, Express, MongoDB',
    'https://github.com/shivamishra12/lost-found-system',
    '',
    'Shivam Mishra',
    'linear-gradient(135deg,#134e5e,#71b280)',
    1
  ],
  [
    'Stock Trading Web App',
    'Interactive mock stock trading platform with real-time tracking.',
    'A mock stock trading application designed to simulate financial market exchanges, supporting portfolio evaluation, user watchlists, and transaction simulations.',
    '📈',
    'JavaScript, Finance, Simulated Trading',
    'https://github.com/shivamishra12/Stock-Trading-Web-App',
    '',
    'Shivam Mishra',
    'linear-gradient(135deg,#0a3d62,#1e3799)',
    1
  ],
  [
    'Library Management System',
    'REST API-driven library asset manager with Node.js and Express.',
    'A library management platform featuring secure RESTful endpoints built with Express and Node.js. Supports complete CRUD operations for managing books, authors, members, and borrows.',
    '📚',
    'Node.js, Express, REST API',
    'https://github.com/shivamishra12/library-management-system',
    '',
    'Shivam Mishra',
    'linear-gradient(135deg,#200122,#6f0000)',
    0
  ],
  [
    'Machine Learning Modules',
    'Implementations of essential ML algorithms and preprocessing pipelines.',
    'A structured collection of Jupyter notebooks implementing regression, classification, clustering, data preprocessing techniques, and model evaluation metrics from scratch.',
    '🤖',
    'Jupyter Notebook, Scikit-learn, ML',
    'https://github.com/shivamishra12/Machine-Learning-Modules',
    '',
    'Shivam Mishra',
    'linear-gradient(135deg,#4b1248,#f10711)',
    0
  ],
  [
    'Patient Management System',
    'Spring Boot-based medical patient tracker using in-memory data store.',
    'A Spring Boot application providing patient intake, record lookup, and profile management CRUD operations using an in-memory repository.',
    '🏥',
    'Spring Boot, Java, REST APIs',
    'https://github.com/shivamishra12/Patient-Managenment-System',
    '',
    'Shivam Mishra',
    'linear-gradient(135deg,#114b3e,#82b260)',
    0
  ],
  [
    'Student Project Portal',
    'Collaborative portal for student projects submission and review.',
    'A web application designed for students and academic evaluators to submit, categorize, and review student projects, portfolios, and research papers.',
    '🎓',
    'JavaScript, Web, Academic Portal',
    'https://github.com/shivamishra12/Student-project-portal',
    '',
    'Shivam Mishra',
    'linear-gradient(135deg,#2c3e50,#3498db)',
    0
  ],
  [
    'Diabetes Prediction AI Model',
    'AI classification model predicting diabetic likelihood using clinical indicators.',
    'A binary classification model built to analyze clinical parameters like glucose, insulin, and BMI to predict the likelihood of diabetes with high precision.',
    '🩸',
    'Jupyter Notebook, ML, Classification',
    'https://github.com/shivamishra12/Diabetes-Prediction-Ai-model',
    '',
    'Shivam Mishra',
    'linear-gradient(135deg,#8e44ad,#2980b9)',
    0
  ],
  [
    'Disease Genetic Predictor',
    'Predictive model combining genetic and clinical attributes for outcomes.',
    'A machine learning pipeline evaluating mixed genetic markers and clinical features to estimate prognostic disease outcomes and patient health risks.',
    '🧬',
    'Jupyter Notebook, Bioinformatics, ML',
    'https://github.com/shivamishra12/Predict-Disease-Outcome-Based-on-Genetic-and-Clinical-Data',
    '',
    'Shivam Mishra',
    'linear-gradient(135deg,#16a085,#2ecc71)',
    0
  ],
  [
    'Rock Paper Scissors Game AI',
    'Simple game AI using reinforcement learning and pattern matching.',
    'An interactive game AI that predicts and adapts to human opponent play patterns in Rock-Paper-Scissors using statistical heuristics.',
    '🎮',
    'Jupyter Notebook, Game AI, Python',
    'https://github.com/shivamishra12/Simple_Game_AI_for_Rock_Paper_Scissors',
    '',
    'Shivam Mishra',
    'linear-gradient(135deg,#e74c3c,#f39c12)',
    0
  ]
];

for (const project of projects) {
  insert.run(...project);
}

console.log('Seeded', projects.length, 'projects.');
db.close();
