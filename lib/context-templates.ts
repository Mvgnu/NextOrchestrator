import { ContextCategory } from './context-service'

/**
 * Predefined context templates for common use cases.
 * These templates can be used as starting points for creating new contexts.
 */

export type ContextTemplate = {
  id: string
  name: string
  description: string
  category: ContextCategory
  tags: string[]
  content: string
}

export const contextTemplates: ContextTemplate[] = [
  {
    id: 'api-documentation',
    name: 'API Documentation',
    description: 'Template for documenting APIs with endpoints, parameters, and examples',
    category: 'documentation',
    tags: ['api', 'reference', 'technical'],
    content: `# API Documentation

## Overview
Describe the API and its purpose here. Include version information, base URLs, and authentication methods.

## Authentication
Explain how to authenticate with the API, including required headers, tokens, etc.

## Endpoints

### GET /resource
Retrieves a list of resources.

#### Parameters
| Name | Type | Required | Description |
|------|------|----------|-------------|
| limit | integer | No | Maximum number of results to return |
| offset | integer | No | Number of results to skip |

#### Response
\`\`\`json
{
  "data": [
    {
      "id": "123",
      "name": "Example Resource"
    }
  ],
  "meta": {
    "total": 100
  }
}
\`\`\`

### POST /resource
Creates a new resource.

#### Request Body
\`\`\`json
{
  "name": "New Resource",
  "description": "Description of the resource"
}
\`\`\`

#### Response
\`\`\`json
{
  "id": "456",
  "name": "New Resource",
  "description": "Description of the resource",
  "created_at": "2023-05-15T10:30:00Z"
}
\`\`\`

## Error Codes
| Code | Description |
|------|-------------|
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Internal Server Error |

## Rate Limiting
Explain any rate limiting policies here.
`
  },
  {
    id: 'project-brief',
    name: 'Project Brief',
    description: 'Template for creating a comprehensive project brief',
    category: 'documentation',
    tags: ['project', 'planning', 'requirements'],
    content: `# Project Brief: [Project Name]

## Project Overview
A brief description of the project, its purpose, and its goals.

## Objectives
- Primary objective
- Secondary objective
- Tertiary objective

## Target Audience
Describe who the project is intended for.

## Requirements

### Functional Requirements
- Requirement 1
- Requirement 2
- Requirement 3

### Technical Requirements
- Technical requirement 1
- Technical requirement 2
- Technical requirement 3

## Timeline
| Phase | Start Date | End Date | Deliverables |
|-------|------------|----------|--------------|
| Planning | YYYY-MM-DD | YYYY-MM-DD | Project plan, resource allocation |
| Development | YYYY-MM-DD | YYYY-MM-DD | Alpha version |
| Testing | YYYY-MM-DD | YYYY-MM-DD | Test results, bug reports |
| Launch | YYYY-MM-DD | YYYY-MM-DD | Production release |

## Budget
Outline the budget for the project.

## Stakeholders
- Stakeholder 1 - Role
- Stakeholder 2 - Role
- Stakeholder 3 - Role

## Success Criteria
Define what success looks like for this project.

## Risks and Mitigations
| Risk | Impact | Probability | Mitigation |
|------|--------|------------|------------|
| Risk 1 | High/Med/Low | High/Med/Low | Mitigation strategy |
| Risk 2 | High/Med/Low | High/Med/Low | Mitigation strategy |
`
  },
  {
    id: 'research-notes',
    name: 'Research Notes',
    description: 'Template for organizing research findings and sources',
    category: 'research',
    tags: ['research', 'notes', 'academic'],
    content: `# Research Notes: [Topic]

## Research Question
State the main research question or hypothesis.

## Executive Summary
A brief overview of your findings and conclusions.

## Methodology
Describe the research methods used.

## Key Findings

### Finding 1
Detailed description of the first key finding.

### Finding 2
Detailed description of the second key finding.

### Finding 3
Detailed description of the third key finding.

## Data Analysis
Explain how the data was analyzed.

## Conclusions
Summarize the conclusions drawn from the research.

## Future Directions
Suggestions for future research on this topic.

## Sources

### Academic Papers
1. Author, A. (Year). Title of paper. *Journal Name*, Volume(Issue), Pages. DOI
2. Author, B. (Year). Title of paper. *Journal Name*, Volume(Issue), Pages. DOI

### Books
1. Author, C. (Year). *Title of Book*. Publisher.
2. Author, D. (Year). *Title of Book*. Publisher.

### Web Sources
1. Author, E. (Year, Month Day). Title of article. Website Name. URL
2. Author, F. (Year, Month Day). Title of article. Website Name. URL

## Appendix
Additional information, charts, or data as needed.
`
  },
  {
    id: 'meeting-notes',
    name: 'Meeting Notes',
    description: 'Template for documenting meetings with action items',
    category: 'meeting',
    tags: ['meeting', 'notes', 'action-items'],
    content: `# Meeting Notes: [Meeting Title]

**Date:** YYYY-MM-DD  
**Time:** HH:MM - HH:MM  
**Location:** [Physical location or virtual platform]  

## Attendees
- Person A (Role)
- Person B (Role)
- Person C (Role)

## Agenda
1. Topic 1
2. Topic 2
3. Topic 3

## Discussion Points

### Topic 1
Summary of discussion for Topic 1.

### Topic 2
Summary of discussion for Topic 2.

### Topic 3
Summary of discussion for Topic 3.

## Decisions Made
- Decision 1
- Decision 2
- Decision 3

## Action Items
| Task | Assignee | Due Date | Status |
|------|----------|----------|--------|
| Task 1 | Person A | YYYY-MM-DD | Not Started |
| Task 2 | Person B | YYYY-MM-DD | Not Started |
| Task 3 | Person C | YYYY-MM-DD | Not Started |

## Next Meeting
**Date:** YYYY-MM-DD  
**Time:** HH:MM - HH:MM  
**Location:** [Physical location or virtual platform]  
**Agenda Items:**
1. Follow-up on action items
2. New topic 1
3. New topic 2

## Notes
Additional notes or comments.
`
  },
  {
    id: 'technical-specs',
    name: 'Technical Specifications',
    description: 'Template for defining technical specifications for a system or component',
    category: 'documentation',
    tags: ['technical', 'specifications', 'architecture'],
    content: `# Technical Specifications: [System/Component Name]

## Overview
Brief description of the system or component.

## Architecture

### System Components
- Component 1
- Component 2
- Component 3

### Architecture Diagram
\`\`\`
[Insert architecture diagram here]
\`\`\`

## Functional Specifications

### Feature 1
Detailed description of feature 1.

#### Requirements
- Requirement 1.1
- Requirement 1.2
- Requirement 1.3

#### Behavior
Describe expected behavior.

### Feature 2
Detailed description of feature 2.

#### Requirements
- Requirement 2.1
- Requirement 2.2
- Requirement 2.3

#### Behavior
Describe expected behavior.

## Technical Specifications

### Data Model
Describe the data model, including entities and relationships.

\`\`\`
[Insert ER diagram or code snippet here]
\`\`\`

### APIs and Interfaces
Document the APIs and interfaces.

\`\`\`
[Insert API definitions here]
\`\`\`

### Performance Requirements
- Performance requirement 1
- Performance requirement 2
- Performance requirement 3

### Security Requirements
- Security requirement 1
- Security requirement 2
- Security requirement 3

## Dependencies
- Dependency 1 (version)
- Dependency 2 (version)
- Dependency 3 (version)

## Testing Strategy
Outline how the system or component will be tested.

## Deployment
Describe the deployment process and requirements.

## Maintenance
Outline maintenance procedures and responsibilities.
`
  }
]

/**
 * Gets a template by ID
 */
export function getTemplateById(id: string): ContextTemplate | undefined {
  return contextTemplates.find(template => template.id === id)
}

/**
 * Gets all templates by category
 */
export function getTemplatesByCategory(category: ContextCategory): ContextTemplate[] {
  return contextTemplates.filter(template => template.category === category)
}

/**
 * Gets all templates that have a specific tag
 */
export function getTemplatesByTag(tag: string): ContextTemplate[] {
  return contextTemplates.filter(template => template.tags.includes(tag))
} 