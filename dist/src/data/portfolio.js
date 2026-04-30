/**
 * Central portfolio content — edit this file to update the site.
 * Keep sensitive credentials out of the repo; only public links here.
 */
export const portfolio = {
  name: 'Murad Hasan Tamim',
  username: '@mhtamim136',
  title: 'Full Stack Developer',
  bio: 'CSE @ AIUB — shipping web & desktop apps with crisp UI, solid logic, and dependable engineering.',
  about:
    'I am Murad Hasan Tamim, a CSE student at AIUB with experience in Java, C#, web development, and project-based software design.',
  location: 'Dhaka, Bangladesh',
  institution: 'American International University-Bangladesh',
  pronouns: 'he/him',
  resumeLink: '/Resume/Resume-MHTamim.pdf',
  githubProfile: 'https://github.com/mhtamim136',

  /** Shown in hero and emphasized in the skills area */
  highlightedSkills: ['Java', 'C#', 'React', 'JavaScript', 'Node.js', 'Tailwind CSS'],

  skills: {
    languages: ['C++', 'Java', 'C#', 'JavaScript'],
    frontend: ['HTML5', 'CSS3', 'React', 'Tailwind CSS'],
    backend: ['Node.js', 'Express.js'],
    database: ['Oracle DB', 'SQL'],
    concepts: ['OOP', 'DSA', 'File Handling'],
  },

  projects: [
    {
      title: 'IdeaBid — Project Request Management',
      problem:
        'Teams needed a single place to submit project requests, review proposals, and route responses without scattered files or email chains.',
      solution:
        'Built a C# Windows Forms app with role-aware flows for users, developers, and admins so requests, proposals, and replies stay structured and traceable.',
      tech: ['C#', 'Windows Forms'],
      live: null,
      github: 'https://github.com/mhtamim136/IdeaBid-Project-Request-Management-Platform',
    },
    {
      title: 'ITFirmHub',
      problem:
        'Small IT shops often track clients and work in ad-hoc spreadsheets, making updates and lookups slow and error-prone.',
      solution:
        'Delivered a Java Swing desktop tool with full CRUD, search, and file-backed persistence so firm data stays consistent and easy to maintain.',
      tech: ['Java', 'Swing', 'File Handling'],
      live: null,
      github: 'https://github.com/mhtamim136/ItFirmHub',
    },
    {
      title: 'TeamFlow-Lite Mini Task Tracker',
      problem:
        'Lightweight teams need task visibility without the weight of a full project-management suite.',
      solution:
        'Implemented a minimal Java task tracker focused on clarity and speed—organize, update, and scan work with little setup.',
      tech: ['Java'],
      live: null,
      github: 'https://github.com/mhtamim136/TeamFlow-Lite-Mini-Task-Tracker',
    },
    {
      title: 'mhtamim136.github.io',
      problem:
        'Projects and profile were spread across repos with no cohesive, public-facing overview.',
      solution:
        'Shipped a static portfolio site that showcases work, stacks, and links in one fast, maintainable place.',
      tech: ['HTML', 'CSS', 'JavaScript'],
      live: 'https://mhtamim136.github.io',
      github: 'https://github.com/mhtamim136/mhtamim136.github.io',
    },
  ],

  experience: [
    {
      role: 'CSE Student',
      company: 'AIUB',
      duration: 'Present',
      points: [
        'Studying core computer science and software engineering concepts',
        'Building Java, C#, and web-based projects end to end',
        'Practicing UI design, problem solving, and file-based application development',
      ],
    },
  ],

  services: [
    {
      title: 'Web interfaces',
      description: 'Responsive, accessible UIs with React and Tailwind—clear hierarchy and fast interaction patterns.',
      icon: 'layout',
    },
    {
      title: 'Desktop tooling',
      description: 'Windows Forms and Java Swing utilities for internal workflows, CRUD, and file-driven persistence.',
      icon: 'monitor',
    },
    {
      title: 'APIs & logic',
      description: 'Node/Express services with structured data layers and pragmatic error handling.',
      icon: 'server',
    },
    {
      title: 'Product thinking',
      description: 'Problem-first specs: scope, trade-offs, and maintainable structure for student and portfolio-grade apps.',
      icon: 'compass',
    },
  ],

  contacts: {
    email: 'mhtamim136@gmail.com',
    github: 'https://github.com/mhtamim136',
    portfolio: 'https://mhtamim136.github.io',
    facebook: 'https://www.facebook.com/mhtamim136/',
    instagram: 'https://www.instagram.com/mhtamim136',
    x: 'https://x.com/tamim_136',
    discord: 'https://discordapp.com/users/1148815562080800900',
  },

  nav: [
    { id: 'hero', label: 'Home', icon: 'home' },
    { id: 'about', label: 'About', icon: 'user' },
    { id: 'skills', label: 'Skills', icon: 'stack' },
    { id: 'projects', label: 'Projects', icon: 'grid' },
    { id: 'experience', label: 'Experience', icon: 'timeline' },
    { id: 'services', label: 'Services', icon: 'spark' },
    { id: 'contact', label: 'Contact', icon: 'mail' },
  ],
};

export default portfolio;
