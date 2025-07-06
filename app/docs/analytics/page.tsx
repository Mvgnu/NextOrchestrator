export default function DocsAnalyticsPage() {
  return (
    <article>
      <h1>Analytics Dashboards</h1>

      <p>
        MARS Next provides dashboards to help you monitor your usage of AI models 
        and understand how your agents are performing. You can access these via the 
        sidebar navigation when viewing your main <a href="/dashboard">Dashboard</a>.
      </p>

      <h2>Usage Analytics</h2>
      <p>
        The Usage Analytics page gives you an overview of your API consumption and costs.
      </p>
      <ul>
        <li><strong>Date Range Picker:</strong> Select the time period for which you want to view usage data (e.g., last 7 days, last 30 days, custom range).</li>
        <li><strong>Summary Cards:</strong>
          <ul>
            <li><strong>Total Cost:</strong> Estimated cost based on token usage for the selected period.</li>
            <li><strong>Total Tokens:</strong> The sum of all prompt and completion tokens used across all projects and agents within the selected timeframe.</li>
            <li><strong>Total Estimated Cost:</strong> An approximate cost calculated based on the token usage per model.</li>
            <li><strong>Daily Average:</strong> Average token consumption per day over the selected period.</li>
          </ul>
        </li>
        <li><strong>Usage Trends Chart:</strong> A visual representation (Area chart) of your token usage over the selected time period.</li>
        <li><strong>Usage Breakdown:</strong> Shows token usage percentage attributed to different projects, AI providers (OpenAI, Anthropic, etc.), and specific models (GPT-4, Claude 3, etc.). Uses progress bars for easy comparison.</li>
      </ul>
      <blockquote className="border-l-4 border-yellow-500 pl-4 my-4">
          <p><strong>Note:</strong> A &quot;Monthly Limit&quot; is not currently displayed or enforced in this dashboard.</p>
        <p>
          <strong>Cost Estimation:</strong> Costs are estimated within <code>api-usage-service.ts</code> using a hardcoded price list (<code>COST_PER_1K_TOKENS</code>) for various models based on prompt and completion tokens. 
          These prices reflect approximate rates from sometime in 2023 and may not be perfectly accurate or up-to-date with current provider pricing. 
          A default fallback cost is used for unrecognized models.
        </p>
      </blockquote>

      <h2 id="agent-performance">Agent Performance</h2>
      <p>
        The Agent Performance page allows you to analyze the effectiveness and efficiency of your individual AI agents.
      </p>
      <ul>
        <li><strong>Agent Selector:</strong> Choose a specific agent from the dropdown to view its detailed performance data.</li>
        <li><strong>Timeframe Selector:</strong> Select the period for analysis (Last 7/30/90 days).</li>
        <li><strong>Summary Cards (Per Agent):</strong>
          <ul>
            <li><strong>Average Rating:</strong> The average rating given to this agent via the <a href="/docs/chat#feedback">feedback mechanism</a> in the Chat Interface. Includes a trend indicator showing change versus the previous period.</li>
            <li><strong>Usage Count:</strong> The total number of times this agent was invoked (based on feedback/rating interactions).</li>
            <li><strong>Token Usage:</strong> Total tokens consumed specifically by this agent. Includes a trend indicator.</li>
            <li><strong>Estimated Cost:</strong> Total estimated cost for the agent&apos;s interactions.</li>
          </ul>
        </li>
        <li><strong>Performance Trends Chart:</strong> A chart visualizing trends over the selected timeframe. You can toggle between:
          <ul>
            <li><strong>Rating View (Line Chart):</strong> Shows the average daily rating over time.</li>
            <li><strong>Usage View (Area Chart):</strong> Shows the daily token consumption over time.</li>
          </ul>
        </li>
        <li><strong>Performance Comparison Charts:</strong>
          <ul>
            <li><strong>Rating Comparison (Bar Chart):</strong> Compares the average rating of the selected agent against all other agents.</li>
            <li><strong>Token Usage Distribution (Pie Chart):</strong> Shows the proportion of total token usage attributed to each agent.</li>
          </ul>
        </li>
      </ul>
      <blockquote className="border-l-4 border-yellow-500 pl-4 my-4">
        <p><strong>Note:</strong> Agent performance metrics, especially Average Rating and Usage Count, depend on data collected from the <a href="/docs/chat#feedback">feedback mechanism</a> in the Chat Interface. Ensure you are providing feedback for accurate tracking.</p>
        <p>
          <strong>Trend Calculation:</strong> Trends are calculated in <code>ApiUsageService.getAgentPerformanceData</code> by comparing the sum of values (ratings or tokens) from the first half of the selected date range to the sum of values from the second half. 
          This provides a basic indication of upward or downward movement within the period.
        </p>
      </blockquote>

    </article>
  )
}
