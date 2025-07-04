export default function DocsContextsPage() {
  return (
    <article>
      <h1>Managing Contexts</h1>

      <p>
        Context documents provide the background information, data, and source material 
        that your AI Agents use to generate informed responses and perform tasks within 
        the <a href="/docs/chat">Chat Interface</a>. Effective context management is key to getting 
        high-quality results from your agents.
      </p>

      <h2>Adding Context to a Project</h2>
      <p>
        Contexts are added on a per-project basis. Navigate to the desired 
        <a href="/docs/projects">Project</a> and select the "Contexts" tab. Click the 
        "Add Context" button.
      </p>
      <p>
        You can add context in several ways:
      </p>
      <ul>
        <li><strong>File Upload:</strong> Upload plain text files (e.g., <code>.txt</code>, <code>.md</code>, <code>.json</code>, <code>.py</code>, <code>.js</code>, etc.). The system reads the raw text content. Note: Binary files like PDFs or Word documents are <strong>not</strong> currently supported directly; please convert them to plain text first.</li>
        <li><strong>Markdown Editor:</strong> Create or paste content directly using a built-in Markdown editor. This gives you more control over formatting.</li>
      </ul>
      <blockquote className="border-l-4 border-yellow-500 pl-4 my-4">
        {/* File types documented above */}
      </blockquote>
      <p>
        When adding context, you'll typically provide a <strong>Name</strong> for easy identification.
      </p>

      <h2>Viewing and Managing Contexts</h2>
      <p>
        The "Contexts" tab on the project page lists all context documents for that project.
      </p>
      <ul>
        <li><strong>List View:</strong> Shows the name and creation date of each context document.</li>
        <li><strong>Viewing Content:</strong> Click the "View" button next to a context document to open the Context Viewer page.</li>
        <li><strong>Editing:</strong> Click the "Edit" button (if available) to modify the context name or content.</li>
        <li><strong>Deleting:</strong> Click the "Delete" button to permanently remove a context document and its history.</li>
      </ul>

      <h2>The Context Viewer</h2>
      <p>
        The Context Viewer page displays the full content of a selected document.
      </p>
      <ul>
        <li><strong>Content Display:</strong> The main area shows the document content, rendered appropriately (e.g., Markdown rendering for .md files).</li>
        <li><strong>Metadata:</strong> Displays information like creation date and last updated date. Support for categories and tags is planned but not yet implemented.</li>
        <li><strong>Actions:</strong> Buttons are available for navigating back, Editing the current content, viewing Version History, Sharing (planned), and Deleting the context.</li>
        <li><strong>Table of Contents:</strong> For well-structured documents (like Markdown with headings), a table of contents is automatically generated for easy navigation.</li>
      </ul>
      <blockquote className="border-l-4 border-yellow-500 pl-4 my-4">
        <p><strong>Connection:</strong> The content displayed here is what Agents will process when this context is selected in the <a href="/docs/chat">Chat Interface</a>.</p>
        <p><strong>Note:</strong> The metadata system (categories, tags) is not yet implemented.</p>
        <p><strong>Note:</strong> Context Export (e.g., to PDF, Markdown) is not yet implemented.</p>
      </blockquote>

      <h2>Context Versioning</h2>
      <p>
        MARS Next automatically saves historical versions whenever you edit a context document. 
        This allows you to track changes and revert to previous states if needed.
      </p>
      <ul>
        <li><strong>Accessing History:</strong> From the Context Viewer page, click the "Version History" button to see a list of all saved versions, ordered by date.</li>
        <li><strong>Viewing Past Versions:</strong> Click on a specific version in the history list to view its content snapshot and metadata as they were at that point in time.</li>
        <li><strong>Restoring a Version:</strong> On the Version Viewer page for a historical version, click "Restore This Version" to make that snapshot the current, active content of the context document. The previous current version will be saved as a new historical entry.</li>
        <li><strong>Deleting Versions:</strong> You can delete specific historical versions from the Version Viewer page. Note that you cannot delete the currently active version.</li>
      </ul>

    </article>
  )
}
