/**
 * Central portfolio content — edit this file to update the site.
 * Keep sensitive credentials out of the repo; only public links here.
 */
export const portfolio = {
  name: 'Murad Hasan Tamim',
  username: '@mhtamim136',
  title: 'Software Developer (CSE Student)',
  bio: 'CSE @ AIUB — building web and desktop applications with clean UI, strong logic, and problem-solving focus.',
  about:
    'I am Murad Hasan Tamim, a CSE student at AIUB focused on building practical software solutions. I develop applications using Java, C#, and web technologies, with an emphasis on clean UI design and problem solving.',
  location: 'Dhaka, Bangladesh',
  institution: 'American International University-Bangladesh',
  pronouns: 'he/him',
  resumeLink: '/Resume/Resume-MHTamim.pdf',
  githubProfile: 'https://github.com/mhtamim136',

  /** Shown in hero and emphasized in the skills area */
highlightedSkills: ['C++','Java', 'C#', 'JavaScript', 'React', 'Node.js'],

skills: {
  languages: ['C++', 'Java', 'C#', 'JavaScript'],
  frontend: ['HTML5', 'CSS3', 'React', 'Tailwind CSS'],
  backend: ['Node.js', 'Express.js', 'PHP'],
  database: ['MySQL', 'SQL Server', 'Oracle DB'],
  concepts: ['OOP', 'DSA', 'Problem Solving'],
},

  projects: [
    {
      title: 'IdeaBid – Project Request & Management Platform',
      problem: "Managing project requests, proposals, and communication across users, developers, and admins is often fragmented and inefficient.",
      solution: "Built a C# Windows Forms application with role-based access to streamline project requests, proposal handling, and transaction tracking in one centralized system.",
      tech: ['C#', 'Windows Forms'],
      live: null,
      github: 'https://github.com/mhtamim136/IdeaBid--Project-Request-Management-Platform',
    },
    {
      title: 'ITFirmHub',
      problem: "Small IT firms often lack a centralized system to store and manage firm information, making data access and updates inefficient.",
      solution: "Developed a Java Swing-based desktop application that allows users to add, update, search, and manage IT firm details in a structured and user-friendly way.",
      tech: ['Java', 'Swing', 'File Handling'],
      live: null,
      github: 'https://github.com/mhtamim136/ItFirmHub',
    },
    {
      title: 'TeamFlow-Lite Mini Task Tracker',
      problem: "Small teams often lack a simple and efficient way to track tasks, deadlines, and individual contributions without using complex project management tools.",
      solution: "Developed a lightweight Java-based task management system with CRUD operations, deadline tracking, and progress monitoring, using file-based storage for simplicity and ease of use.",
      tech: ['Java'],
      live: null,
      github: 'https://github.com/mhtamim136/TeamFlow-Lite-Mini-Task-Tracker',
    },
    {
      title: 'Profile Card',
      description: 'A personal profile card showcasing my information, social links, and quick access to my portfolio and GitHub.',
      tech: ['HTML', 'CSS', 'JavaScript'],
      live: 'https://mhtamim136.github.io/profile-card/',
      github: 'https://github.com/mhtamim136/profile-card',
    },
    {
      title: 'AI Governance Dashboard',
      description: 'A research-based web dashboard implementing the DCAG framework to evaluate AI governance readiness across policy, institutional, technical, risk, and ethical dimensions.',
      tech: ['HTML', 'CSS', 'JavaScript'],
      live: 'https://mhtamim136.github.io/ai-governance/',
      github: 'https://github.com/mhtamim136/ai-governance',
    },
    {
      title: 'BuyTrust: Your Marketplace for New & Pre-owned Items',
      description: 'E-commerce system design with Figma UI layouts and core diagrams including use case, activity, sequence, and class.',
       problem: 'No unified platform for buying and selling both new and pre-owned items, along with issues like trust, fake listings, and high commissions.',
      solution: 'Designed a secure and user-friendly marketplace concept supporting both new and pre-owned items with verified users, safe transactions, and structured system workflows.',

      tech: ['Figma', 'System Design', 'UML'],
      live: null,
      github: 'https://github.com/mhtamim136/BuyTrust',
    }
  ],

  experience: [
    {
      role: 'CSE Student | Aspiring Software Developer',
      company: 'AIUB',
      duration: 'Present',
      points: [
        'Building a strong foundation in data structures, object-oriented programming, and software engineering',
        'Developing full applications using Java, C#, and web technologies (React, Tailwind)',
        'Designing responsive user interfaces and implementing file-based data persistence',
        'Working with databases including Oracle DB and SQL for data management',
        'Applying problem-solving skills to real-world academic and personal projects'
      ],
    },
  ],

services: [
  {
    title: 'Web interfaces',
    description: 'Responsive and user-friendly interfaces built with React and Tailwind, focusing on clean design, usability, and performance.',
    icon: 'layout',
  },
  {
    title: 'Desktop applications',
    description: 'Java Swing and C# Windows Forms applications with full CRUD functionality and file-based data management.',
    icon: 'monitor',
  },
  {
    title: 'Database & data handling',
    description: 'Working with Oracle DB and SQL for structured data storage, along with file-based persistence for lightweight systems.',
    icon: 'database',
  },
  {
    title: 'Problem solving',
    description: 'Designing practical solutions using OOP, structured logic, and efficient workflows for real-world applications.',
    icon: 'brain',
  },
],

  contacts: {
    email: 'mhtamim136@gmail.com',
    github: 'https://github.com/mhtamim136',
    portfolio: 'https://mhtamim136.github.io/profile-card/',
    facebook: 'https://www.facebook.com/mhtamim136/',
    instagram: 'https://www.instagram.com/mhtamim136',
    x: 'https://x.com/tamim_136',
    discord: 'https://discordapp.com/users/1148815562080800900',
  },

  nav: [
    { id: 'hero', label: 'Home', icon: 'home' },
    { id: 'about', label: 'About', icon: 'user' },
    { id: 'skills', label: 'Skills', icon: 'code' },
    { id: 'projects', label: 'Projects', icon: 'folder' },
    { id: 'experience', label: 'Experience', icon: 'timeline' },
    { id: 'services', label: 'Services', icon: 'layers' },
    { id: 'contact', label: 'Contact', icon: 'mail' },
  ],
};

export default portfolio;
