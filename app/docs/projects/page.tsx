export default function DocsProjectsPage() {
  return (
    <article>
      <h1>Managing Projects</h1>

      <p>
        Projects are the core organizational unit in MARS Next. Each project acts as a 
        workspace containing its own set of AI Agents and Context documents that they 
        can reference.
      </p>

      <h2>Creating a New Project</h2>
      <p>
        You can create a new project directly from your main <a href="/dashboard">Dashboard</a> 
        by clicking the "New Project" button. This will take you to a simple form where you need to provide:
      </p>
      <ul>
        <li><strong>Name:</strong> A required, descriptive name for your project (e.g., "Q3 Marketing Strategy", "Competitor Analysis").</li>
        <li><strong>Description (Optional):</strong> A brief summary of the project's purpose.</li>
      </ul>
      <p>
        Upon creation, you'll be redirected to the project's main page.
      </p>

      <h2>The Project Page</h2>
      <p>
        The main page for each project provides an overview and access to its components. 
        Key areas include:
      </p>
      <ul>
        <li><strong>Header:</strong> Displays the project name and description, along with buttons to access the <a href="#project-settings">Project Settings</a> and open the <a href="/docs/chat">Chat Interface</a> for this project.</li>
        <li><strong>Tabs (Contexts / Agents):</strong> Allows you to switch between viewing the list of Contexts and Agents associated with this project.</li>
      </ul>

      <h3>Contexts Tab</h3>
      <p>
        This tab lists all the <a href="/docs/contexts">Context documents</a> you have added to the project. 
        From here, you can:
      </p>
      <ul>
        <li>See a list of existing contexts with their names and creation dates.</li>
        <li>Click the "Add Context" button to create a new context document.</li>
        <li>Click "View" on a specific context to see its content and details.</li>
      </ul>
      <blockquote className="border-l-4 border-blue-500 pl-4 my-4">
          <p><strong>Connection:</strong> Contexts listed here are available for selection within the project's <a href="/docs/chat">Chat Interface</a> to provide relevant information to your Agents.</p>
      </blockquote>

      <h3>Agents Tab</h3>
      <p>
        This tab lists all the <a href="/docs/agents">AI Agents</a> you have configured for this project. 
        From here, you can:
      </p>
      <ul>
        <li>See a list of existing agents, their names, descriptions, base model, and temperature setting.</li>
        <li>Click the "Create Agent" button to configure a new agent.</li>
        <li>"Edit" or "Delete" existing agents.</li>
      </ul>
      <blockquote className="border-l-4 border-blue-500 pl-4 my-4">
          <p><strong>Connection:</strong> Agents configured here can be selected within the project's <a href="/docs/chat">Chat Interface</a> to perform tasks using the selected Contexts.</p>
      </blockquote>

      <h2 id="project-settings">Project Settings</h2>
      <p>
        Each project has its own settings page, accessible via the "Settings" button in the project header. 
        Currently, project settings primarily allow:
      </p>
      <ul>
        <li>Editing the project Name and Description.</li>
        <li>Deleting the project.</li>
      </ul>
      <blockquote className="border-l-4 border-yellow-500 pl-4 my-4">
        <p><strong>Note:</strong> Features like collaborator management and granular access controls are planned for future updates but are not yet implemented in project settings.</p>
      </blockquote>

      <h2>Navigating Between Projects</h2>
      <p>
        You can always return to your main <a href="/dashboard">Dashboard</a> using the global header or the "Back to Dashboard" link 
        on the project page to see and select other projects.
      </p>
    </article>
  )
}
