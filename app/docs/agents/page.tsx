export default function DocsAgentsPage() {
  return (
    <article>
      <h1>Working with Agents</h1>

      <p>
        AI Agents are the core workers in MARS Next. You configure them within a specific 
        project to perform tasks based on your instructions and the provided context. 
        Agents can be tailored for various roles like research, summarization, coding assistance, 
        data analysis, and more.
      </p>

      <h2>Creating a New Agent</h2>
      <p>
        You can create agents from the project page. Navigate to the desired 
        <a href="/docs/projects">Project</a> and select the &quot;Agents&quot; tab. Click the &quot;Create Agent&quot;
        button to open the agent creation form.
      </p>

      <h3>Using Agent Presets</h3>
      <p>
        To quickly set up an agent for a common role, you can use Agent Presets. 
        The creation form includes several preset templates (e.g., &quot;General Assistant&quot;, &quot;Researcher&quot;, &quot;Critic&quot;).
        Clicking a preset button automatically fills the form with recommended settings (Provider, Model, Temperature, System Prompt) 
        for that role. You can then customize these settings further if needed.
      </p>
      <p>
        Administrators can also create custom system-wide presets.
      </p>

      <h3>Configuration Fields</h3>
      <p>
        The form includes the following fields:
      </p>
      <ul>
        <li><strong>Name:</strong> A descriptive name for the agent (e.g., &quot;Legal Clause Analyzer&quot;, &quot;Marketing Copywriter&quot;).</li>
        <li><strong>Description (Optional):</strong> Briefly explain the agent&apos;s intended purpose or specialty.</li>
        <li>
          <strong>Model:</strong> Select the underlying AI model the agent will use (e.g., GPT-4, Claude 3 Sonnet, Gemini Pro). 
          Model availability depends on the API keys you have configured in your <a href="/docs/settings#api-keys">Settings</a>.
        </li>
        <li><strong>Temperature:</strong> A value (usually between 0 and 1) controlling the randomness of the output. Lower values (e.g., 0.2) produce more focused and deterministic results, while higher values (e.g., 0.8) lead to more creative and diverse outputs.</li>
        <li><strong>Max Tokens (Optional):</strong> Set a maximum limit on the number of tokens the model can generate in a single response. This can help control costs and response length. If left blank, the model&apos;s default maximum is used.</li>
        <li><strong>System Prompt:</strong> Define the agent&apos;s persona, instructions, constraints, and background information. This is crucial for guiding the agent&apos;s behavior.</li>
        <li>
          <strong>Conversation Memory (Toggle):</strong> Enable or disable the agent&apos;s ability to remember
          previous interactions within the current chat session. 
          <blockquote className="border-l-4 border-blue-500 pl-4 my-4">
            <p><strong>Connection:</strong> When enabled, the agent considers past messages in the <a href="/docs/chat">Chat Interface</a> when generating new responses. Disabling it makes each interaction independent.</p>
          </blockquote>
        </li>
      </ul>
      <blockquote className="border-l-4 border-yellow-500 pl-4 my-4">
        <p><strong>Note:</strong> Other model parameters like Top P are not currently exposed in the UI.</p>
      </blockquote>

      <h2>Managing Agents</h2>
      <p>
        The &quot;Agents&quot; tab on the project page lists all agents created for that project.
      </p>
      <ul>
        <li><strong>Viewing:</strong> You can see the name, description, model, and temperature for each agent.</li>
        <li><strong>Editing:</strong> Click the &quot;Edit&quot; button to modify an agent&apos;s configuration using the same form as creation.</li>
        <li><strong>Deleting:</strong> Click the &quot;Delete&quot; button to permanently remove an agent. This action cannot be undone.</li>
      </ul>

      <h2>Agent Performance and Feedback</h2>
      <p>
        You can monitor how your agents are performing in the <a href="/docs/analytics#agent-performance">Agent Performance</a> section of the dashboard. 
        This section shows metrics like average user ratings, token usage, and estimated costs per agent, based on feedback collected.
      </p>
      <blockquote className="border-l-4 border-yellow-500 pl-4 my-4">
        <p><strong>Note:</strong> The chat interface includes placeholder feedback buttons (thumbs up/down) on agent messages, but the system for submitting and processing this feedback is not yet fully implemented.</p>
      </blockquote>

    </article>
  )
}
