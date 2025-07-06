export default function DocsSettingsPage() {
  return (
    <article>
      <h1>Account and Project Settings</h1>

      <p>
        MARS Next allows you to configure settings both at the account level (applying 
        to your entire usage) and at the project level (specific to individual projects).
      </p>

      <h2 id="account-settings">Account Settings</h2>
      <p>
        Account-level settings can typically be accessed from the user menu in the 
        global header (often represented by your user avatar or name).
      </p>

      <h3 id="api-keys">API Key Management</h3>
      <p>
        To allow MARS Next agents to use models from different AI providers (like OpenAI, 
        Anthropic, Google, etc.), you need to add your API keys.
      </p>
      <ul>
        <li>Navigate to the API Keys section within your account settings.</li>
          <li>Click &quot;Add New Key&quot;.</li>
        <li>Select the <strong>Provider</strong> from the dropdown list.</li>
          <li>Give the key a recognizable <strong>Name</strong> (e.g., &quot;My Personal OpenAI Key&quot;).</li>
        <li>Paste your <strong>API Key</strong> into the designated field. Your key will be encrypted for security.</li>
          <li>Ensure the key is marked as &quot;Active&quot; if you want agents to be able to use it.</li>
        <li>You can deactivate, edit the name of, or delete keys as needed.</li>
      </ul>
      <blockquote className="border-l-4 border-blue-500 pl-4 my-4">
        <p><strong>Connection:</strong> The AI models available for selection when creating or editing an <a href="/docs/agents">Agent</a> depend on the active API keys you have configured here for the corresponding providers.</p>
      </blockquote>

      <h3>Theme Preferences</h3>
      <p>
        You can switch between light, dark, and system default themes for the application interface.
      </p>
      <ul>
        <li>
          The theme toggle button (usually showing a Sun, Moon, or Laptop icon) is located 
          in the main application header, typically next to your user account menu/avatar.
        </li>
        <li>Click the button to open a dropdown menu and select your preferred theme (Light, Dark, System).</li>
      </ul>
      <blockquote className="border-l-4 border-yellow-500 pl-4 my-4">
        {/* Theme toggle documented above */}
      </blockquote>
      
      <h3>Other Settings</h3>
      <p>
        The account settings area may include other options:
      </p>
      <ul>
          <li><strong>Profile Information:</strong> Your name, email, and avatar (as provided by your login method) are displayed in the user account menu. Functionality for directly editing profile details within MARS Next might be limited.</li>
          <li><strong>Preferences:</strong> An explicit &quot;Preferences&quot; section might exist for future settings (e.g., notifications), but specific options are not yet documented.</li>
      </ul>
      <blockquote className="border-l-4 border-yellow-500 pl-4 my-4">
        {/* Other settings mentioned above; specific implementations like notification preferences are not yet documented/implemented. */}
      </blockquote>

      <h2>Project Settings</h2>
      <p>
        Settings specific to an individual project can be accessed by navigating to the 
        <a href="/docs/projects">Project Page</a> and clicking the &quot;Settings&quot; button in the header.
      </p>
      <p>
        Refer to the <a href="/docs/projects#project-settings">Project Settings documentation</a> within the Managing Projects section for details on available options.
      </p>
      <blockquote className="border-l-4 border-yellow-500 pl-4 my-4">
        <p><strong>Note:</strong> This section will evolve as features like collaborator management are introduced. Be sure to keep the linked documentation current.</p>
      </blockquote>

    </article>
  )
}
