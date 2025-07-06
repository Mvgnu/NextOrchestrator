export default function DocsChatPage() {
  return (
    <article>
      <h1>Using the Chat Interface</h1>

      <p>
        The Chat Interface is where you interact directly with the AI Agents you&apos;ve configured
        for your project. You can ask questions, give instructions, and have conversations, 
        leveraging the agents&apos; abilities and the project&apos;s context documents.
      </p>

      <h2>Accessing the Chat</h2>
      <p>
        To open the chat for a specific project, navigate to the <a href="/docs/projects">Project Page</a> 
          and click the &quot;Open Chat&quot; button in the header.
      </p>

      <h2>Chat Layout</h2>
      <p>
        The chat interface is composed of several key areas:
      </p>
      <ul>
        <li>
          <strong>Agent Selector:</strong> A dropdown menu at the top where you select the 
          single AI Agent you want to interact with for the current conversation.
        </li>
        <li>
          <strong>Context Selector:</strong> A list of available context documents for the project, 
          displayed with checkboxes. Select one or more contexts to provide relevant background 
          information to the chosen agent for its responses.
        </li>
        <li><strong>Message History:</strong> The main area displays the ongoing conversation, 
          including user messages and agent responses.</li>
        <li><strong>Input Area:</strong> A text box at the bottom where you type your messages 
          or prompts to the selected agent.</li>
        <li><strong>Send Button:</strong> Submits your message to the agent.</li>
      </ul>
      <blockquote className="border-l-4 border-yellow-500 pl-4 my-4">
        {/* Selectors documented above */}
        <p><strong>Note:</strong> While the underlying services might support advanced synthesis across multiple agents, the current chat interface primarily focuses on interaction with a single selected agent at a time.</p>
      </blockquote>

      <h2>Interacting with Agents</h2>
      <ol>
        <li><strong>Select Agent(s):</strong> Choose the agent(s) suitable for your current task from the selector.</li>
        <li><strong>Select Context(s):</strong> Choose the relevant context documents the agent(s) should use.</li>
        <li><strong>Type Your Message:</strong> Enter your question, instruction, or prompt in the input field.</li>
          <li><strong>Send:</strong> Click the &quot;Send&quot; button or press Enter.</li>
        <li><strong>View Response:</strong> The agent(s) will process your request using the selected context, and their response(s) will appear in the message history.</li>
      </ol>
      <p>
          This interaction is powered by the `/api/projects/[projectId]/chat` API endpoint.
          This endpoint takes your message, selected agent configuration, context document identifiers, 
            and conversation history, then streams the agent&apos;s response back to the interface.
      </p>
      <blockquote className="border-l-4 border-yellow-500 pl-4 my-4">
          <p><strong>API Implementation Status:</strong></p>
          <ul>
              <li>Handles streaming responses from the agent service (currently OpenAI only).</li>
              <li>Authentication and basic agent ownership checks are implemented.</li>
              <li><strong>Context Fetching:</strong> The list of available contexts for the selector and the content of selected contexts used during chat are now fetched from the backend using the Context Service.</li>
              <li><strong>Access Control:</strong> Basic checks ensure you own the project and the selected agent. More granular project-level access controls (e.g., for collaborators) are planned but not yet fully implemented.</li>
          </ul>
      </blockquote>

      <h2>Agent Memory</h2>
      <p>
        If an agent has <a href="/docs/agents">Conversation Memory</a> enabled, it will consider previous turns 
        in the current chat session when formulating its response. If memory is disabled, each message 
        is treated independently.
      </p>
      <blockquote className="border-l-4 border-yellow-500 pl-4 my-4">
        <p><strong>Note:</strong> Automatic summarization of long conversations for memory is not currently implemented. The agent receives the recent raw message history when memory is enabled.</p>
      </blockquote>

      <h2>Feedback</h2>
      <p>
        Providing feedback on agent responses helps improve their performance over time. 
        While the full feedback system is under development, basic placeholders exist.
      </p>
      <blockquote className="border-l-4 border-yellow-500 pl-4 my-4">
        <p><strong>Note:</strong> Placeholder feedback buttons (thumbs up/down) appear below agent messages. Clicking them does not yet submit feedback, as the backend service logic is pending full implementation.</p>
      </blockquote>

    </article>
  )
}
