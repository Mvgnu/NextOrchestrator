export default function GettingStartedPage() {
  return (
    <article>
      <h1>Getting Started</h1>

      <p>
        Welcome to MARS Next! This guide will walk you through the initial steps 
        to set up your account and begin using the platform.
      </p>

      <h2>1. Account Setup</h2>
      <p>
        Before you can create projects and agents, you need an account. If you 
          don&apos;t have one already, follow these steps:
      </p>
      <ul>
        <li>Navigate to the <a href="/auth/signin">Sign In</a> page.</li>
        <li>Choose your preferred sign-in method (e.g., Google, GitHub, or email/password if enabled).</li>
        <li>Follow the prompts to authenticate and create your account.</li>
        <li>Once signed in, you will be redirected to your dashboard.</li>
      </ul>

      <h2>2. Navigating the Dashboard</h2>
      <p>
        The main dashboard is your central hub. Here you can see:
      </p>
      <ul>
        <li><strong>Summary Cards:</strong> Quick overview of your projects, agents, and API usage.</li>
        <li><strong>Recent Projects:</strong> A list of your most recently accessed projects.</li>
        <li><strong>Navigation Sidebar (on Dashboard pages):</strong> Links to Overview, Usage Analytics, and Agent Performance.</li>
        <li><strong>Global Header:</strong> Access to your account settings and sign-out options.</li>
      </ul>

      <h2>3. Creating Your First Project</h2>
      <p>
        Projects are containers for your work, including contexts and agents.
      </p>
      <ol>
          <li>From the dashboard, click the &quot;New Project&quot; button.</li>
        <li>You will be redirected to the project creation page.</li>
        <li>Enter a descriptive <strong>Name</strong> for your project.</li>
        <li>Optionally, add a <strong>Description</strong> to provide more context.</li>
          <li>Click &quot;Create Project&quot;.</li>
          <li>You will be taken to the newly created project&apos;s page.</li>
      </ol>

      <h2>4. Understanding the Project Interface</h2>
      <p>
        Inside a project, you have a dedicated navigation sidebar:
      </p>
      <ul>
        <li><strong>Overview:</strong> The main project page showing contexts and agents.</li>
        <li><strong>Chat:</strong> The main interface for interacting with your agents.</li>
        <li><strong>Agents:</strong> Manage agents specific to this project.</li>
        <li><strong>Contexts:</strong> Manage context documents for this project.</li>
        <li><strong>Context Builder:</strong> (If available) Tools for creating/refining context.</li>
        <li><strong>Settings:</strong> Project-specific settings.</li>
      </ul>

      <h2>Next Steps</h2>
      <p>
        Now that you have a project, you can start adding contexts and creating agents. 
        Explore the other documentation sections to learn more:
      </p>
      <ul>
        <li><a href="/docs/projects">Managing Projects</a></li>
        <li><a href="/docs/contexts">Working with Contexts</a></li>
        <li><a href="/docs/agents">Creating Agents</a></li>
      </ul>
    </article>
  )
}
