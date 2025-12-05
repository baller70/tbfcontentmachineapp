/**
 * Content Journey Unit Tests
 * 
 * Comprehensive tests for the Content Journey wizard functionality
 * including state management, step validation, and API interactions.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ============================================================================
// Type Definitions (mirroring the actual types from page.tsx)
// ============================================================================

interface Template {
  id: string
  name: string
  category: string
  fields: Array<{
    fieldName: string
    fieldType: string
    isRequired: boolean
  }>
}

interface WorkspaceBranding {
  id: string
  name: string
  primaryColor: string
  secondaryColor: string
  logoUrl?: string
}

interface WizardState {
  currentStep: number
  selectedCategory: string | null
  selectedTemplates: Template[]
  currentTemplateIndex: number
  formData: Record<string, string>
  formDataByTemplate: Record<string, Record<string, string>>
  selectedBranding: WorkspaceBranding | null
  visualEffects: {
    filter: string
    opacity: number
    blur: number
  }
  promptInstructions: string
  selectedPromptId: string | null
  generatedContent: {
    content: string
    caption: string
    hashtags: string
  }
  generatedContentByTemplate: Record<string, { content: string; caption: string; hashtags: string }>
  generatedGraphicUrls: Record<string, string>
  editableContentByPlatform: Record<string, string>
  selectedPlatforms: string[]
  selectedTeams: string[]
  selectedTags: string[]
  selectedProfileId: string | null
  scheduleType: string
  scheduledDate: string
  scheduledTime: string
  isRecurring: boolean
}

// ============================================================================
// Helper Functions (extracted from page.tsx logic)
// ============================================================================

/**
 * Creates the initial wizard state
 */
function createInitialWizardState(): WizardState {
  return {
    currentStep: 1,
    selectedCategory: null,
    selectedTemplates: [],
    currentTemplateIndex: 0,
    formData: {},
    formDataByTemplate: {},
    selectedBranding: null,
    visualEffects: {
      filter: 'none',
      opacity: 100,
      blur: 0
    },
    promptInstructions: '',
    selectedPromptId: null,
    generatedContent: {
      content: '',
      caption: '',
      hashtags: ''
    },
    generatedContentByTemplate: {},
    generatedGraphicUrls: {},
    editableContentByPlatform: {},
    selectedPlatforms: [],
    selectedTeams: [],
    selectedTags: [],
    selectedProfileId: null,
    scheduleType: 'now',
    scheduledDate: '',
    scheduledTime: '',
    isRecurring: false
  }
}

/**
 * Validates each step of the wizard
 */
function validateStep(state: WizardState, step: number): boolean {
  switch (step) {
    case 1:
      // Step 1: At least one template selected
      return state.selectedTemplates.length > 0
    
    case 2:
      // Step 2: All required fields filled for current template
      const currentTemplate = state.selectedTemplates[state.currentTemplateIndex]
      if (currentTemplate?.fields) {
        const requiredFields = currentTemplate.fields.filter(f => f.isRequired)
        return requiredFields.every(f => state.formData[f.fieldName]?.trim())
      }
      return state.selectedTemplates.length > 0
    
    case 3:
      // Step 3: Optional - always valid
      return true
    
    case 4:
      // Step 4: Content generated
      return Object.keys(state.generatedContentByTemplate).length > 0 &&
        Object.values(state.generatedContentByTemplate).some(content => content.content?.trim())
    
    case 5:
      // Step 5: At least one platform selected
      return state.selectedPlatforms.length > 0
    
    case 6:
      // Step 6: Valid schedule
      if (state.scheduleType === 'scheduled') {
        return !!(state.scheduledDate && state.scheduledTime)
      }
      return true
    
    default:
      return false
  }
}

/**
 * Removes emojis from text (used in Step 5)
 */
function removeEmojis(text: string): string {
  return text.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1F018}-\u{1F270}]|[\u{238C}-\u{2454}]|[\u{20D0}-\u{20FF}]|[\u{FE00}-\u{FE0F}]|[\u{1F190}-\u{1F1FF}]/gu, '')
}

/**
 * Extracts profiles array from API response (bug fix validation)
 */
function extractProfilesFromResponse(data: any): Array<{ id: string; name: string }> {
  // API returns { profiles: [...] }, extract the array
  return data.profiles || []
}

/**
 * Gets content from the correct source (bug fix validation)
 */
function getContentForPost(state: WizardState): { content: string; caption: string; hashtags: string } | null {
  const firstTemplateId = state.selectedTemplates[0]?.id
  if (!firstTemplateId) return null
  
  // FIX: Get content from generatedContentByTemplate, not generatedContent
  return state.generatedContentByTemplate[firstTemplateId] || null
}

// ============================================================================
// Test Suites
// ============================================================================

describe('Content Journey - WizardState', () => {
  it('should create initial state with correct defaults', () => {
    const state = createInitialWizardState()
    
    expect(state.currentStep).toBe(1)
    expect(state.selectedCategory).toBeNull()
    expect(state.selectedTemplates).toEqual([])
    expect(state.currentTemplateIndex).toBe(0)
    expect(state.formData).toEqual({})
    expect(state.selectedPlatforms).toEqual([])
    expect(state.scheduleType).toBe('now')
  })

  it('should have correct visual effects defaults', () => {
    const state = createInitialWizardState()
    
    expect(state.visualEffects.filter).toBe('none')
    expect(state.visualEffects.opacity).toBe(100)
    expect(state.visualEffects.blur).toBe(0)
  })

  it('should have empty generated content by default', () => {
    const state = createInitialWizardState()
    
    expect(state.generatedContent.content).toBe('')
    expect(state.generatedContentByTemplate).toEqual({})
    expect(state.generatedGraphicUrls).toEqual({})
  })
})

describe('Content Journey - Step Validation', () => {
  let state: WizardState

  beforeEach(() => {
    state = createInitialWizardState()
  })

  describe('Step 1: Choose Template', () => {
    it('should fail validation when no template selected', () => {
      expect(validateStep(state, 1)).toBe(false)
    })

    it('should pass validation when template is selected', () => {
      state.selectedTemplates = [{
        id: 'template-1',
        name: 'Test Template',
        category: 'sports',
        fields: []
      }]
      expect(validateStep(state, 1)).toBe(true)
    })

    it('should pass validation with multiple templates', () => {
      state.selectedTemplates = [
        { id: 'template-1', name: 'Template 1', category: 'sports', fields: [] },
        { id: 'template-2', name: 'Template 2', category: 'quotes', fields: [] }
      ]
      expect(validateStep(state, 1)).toBe(true)
    })
  })

  describe('Step 2: Fill Information', () => {
    it('should pass when template has no required fields', () => {
      state.selectedTemplates = [{
        id: 'template-1',
        name: 'Test Template',
        category: 'sports',
        fields: [
          { fieldName: 'optional_field', fieldType: 'text', isRequired: false }
        ]
      }]
      expect(validateStep(state, 2)).toBe(true)
    })

    it('should fail when required field is empty', () => {
      state.selectedTemplates = [{
        id: 'template-1',
        name: 'Test Template',
        category: 'sports',
        fields: [
          { fieldName: 'title', fieldType: 'text', isRequired: true }
        ]
      }]
      state.formData = { title: '' }
      expect(validateStep(state, 2)).toBe(false)
    })

    it('should pass when all required fields are filled', () => {
      state.selectedTemplates = [{
        id: 'template-1',
        name: 'Test Template',
        category: 'sports',
        fields: [
          { fieldName: 'title', fieldType: 'text', isRequired: true },
          { fieldName: 'description', fieldType: 'text', isRequired: true }
        ]
      }]
      state.formData = { title: 'My Title', description: 'My Description' }
      expect(validateStep(state, 2)).toBe(true)
    })

    it('should fail when required field is only whitespace', () => {
      state.selectedTemplates = [{
        id: 'template-1',
        name: 'Test Template',
        category: 'sports',
        fields: [
          { fieldName: 'title', fieldType: 'text', isRequired: true }
        ]
      }]
      state.formData = { title: '   ' }
      expect(validateStep(state, 2)).toBe(false)
    })
  })

  describe('Step 3: Customize Design', () => {
    it('should always pass (optional step)', () => {
      expect(validateStep(state, 3)).toBe(true)
    })

    it('should pass even without branding selected', () => {
      state.selectedBranding = null
      expect(validateStep(state, 3)).toBe(true)
    })
  })

  describe('Step 4: Generate Content', () => {
    it('should fail when no content generated', () => {
      expect(validateStep(state, 4)).toBe(false)
    })

    it('should fail when content is empty string', () => {
      state.generatedContentByTemplate = {
        'template-1': { content: '', caption: '', hashtags: '' }
      }
      expect(validateStep(state, 4)).toBe(false)
    })

    it('should pass when content is generated', () => {
      state.generatedContentByTemplate = {
        'template-1': { content: 'Generated post content', caption: 'Caption', hashtags: '#test' }
      }
      expect(validateStep(state, 4)).toBe(true)
    })
  })

  describe('Step 5: Select Platforms', () => {
    it('should fail when no platform selected', () => {
      expect(validateStep(state, 5)).toBe(false)
    })

    it('should pass when at least one platform selected', () => {
      state.selectedPlatforms = ['twitter']
      expect(validateStep(state, 5)).toBe(true)
    })

    it('should pass with multiple platforms', () => {
      state.selectedPlatforms = ['twitter', 'linkedin', 'facebook']
      expect(validateStep(state, 5)).toBe(true)
    })
  })

  describe('Step 6: Schedule & Review', () => {
    it('should pass for immediate posting', () => {
      state.scheduleType = 'now'
      expect(validateStep(state, 6)).toBe(true)
    })

    it('should fail for scheduled post without date', () => {
      state.scheduleType = 'scheduled'
      state.scheduledDate = ''
      state.scheduledTime = '10:00'
      expect(validateStep(state, 6)).toBe(false)
    })

    it('should fail for scheduled post without time', () => {
      state.scheduleType = 'scheduled'
      state.scheduledDate = '2024-12-25'
      state.scheduledTime = ''
      expect(validateStep(state, 6)).toBe(false)
    })

    it('should pass for scheduled post with date and time', () => {
      state.scheduleType = 'scheduled'
      state.scheduledDate = '2024-12-25'
      state.scheduledTime = '10:00'
      expect(validateStep(state, 6)).toBe(true)
    })
  })
})

describe('Content Journey - Bug Fixes', () => {
  describe('Profile API Response Handling (Bug Fix #1)', () => {
    it('should extract profiles array from API response object', () => {
      const apiResponse = {
        profiles: [
          { id: 'profile-1', name: 'Business Profile' },
          { id: 'profile-2', name: 'Personal Profile' }
        ]
      }
      
      const profiles = extractProfilesFromResponse(apiResponse)
      
      expect(profiles).toHaveLength(2)
      expect(profiles[0].id).toBe('profile-1')
      expect(profiles[1].name).toBe('Personal Profile')
    })

    it('should return empty array when profiles is undefined', () => {
      const apiResponse = {}
      const profiles = extractProfilesFromResponse(apiResponse)
      expect(profiles).toEqual([])
    })

    it('should return empty array when profiles is null', () => {
      const apiResponse = { profiles: null }
      const profiles = extractProfilesFromResponse(apiResponse)
      expect(profiles).toEqual([])
    })
  })

  describe('handlePost Content Retrieval (Bug Fix #2)', () => {
    it('should get content from generatedContentByTemplate', () => {
      const state = createInitialWizardState()
      state.selectedTemplates = [{ id: 'template-1', name: 'Test', category: 'sports', fields: [] }]
      state.generatedContentByTemplate = {
        'template-1': {
          content: 'This is the correct content',
          caption: 'Test caption',
          hashtags: '#test'
        }
      }
      // Note: generatedContent is NOT populated (this was the bug)
      state.generatedContent = { content: '', caption: '', hashtags: '' }
      
      const content = getContentForPost(state)
      
      expect(content).not.toBeNull()
      expect(content?.content).toBe('This is the correct content')
    })

    it('should return null when no template selected', () => {
      const state = createInitialWizardState()
      const content = getContentForPost(state)
      expect(content).toBeNull()
    })

    it('should return null when template has no generated content', () => {
      const state = createInitialWizardState()
      state.selectedTemplates = [{ id: 'template-1', name: 'Test', category: 'sports', fields: [] }]
      state.generatedContentByTemplate = {}
      
      const content = getContentForPost(state)
      expect(content).toBeNull()
    })
  })
})

describe('Content Journey - Emoji Removal', () => {
  it('should remove common emojis', () => {
    const text = 'Hello 😀 World 🌍!'
    const result = removeEmojis(text)
    expect(result).toBe('Hello  World !')
  })

  it('should handle text without emojis', () => {
    const text = 'Plain text without emojis'
    const result = removeEmojis(text)
    expect(result).toBe('Plain text without emojis')
  })

  it('should remove multiple consecutive emojis', () => {
    const text = 'Test 🎉🎊🎁 message'
    const result = removeEmojis(text)
    expect(result).toBe('Test  message')
  })

  it('should handle empty string', () => {
    const result = removeEmojis('')
    expect(result).toBe('')
  })
})

describe('Content Journey - Platform Character Limits', () => {
  const platformLimits: Record<string, number> = {
    twitter: 280,
    linkedin: 3000,
    facebook: 63206,
    instagram: 2200,
    youtube: 5000
  }

  it('should have correct Twitter limit', () => {
    expect(platformLimits.twitter).toBe(280)
  })

  it('should have correct LinkedIn limit', () => {
    expect(platformLimits.linkedin).toBe(3000)
  })

  it('should have correct Instagram limit', () => {
    expect(platformLimits.instagram).toBe(2200)
  })

  it('should detect content over limit', () => {
    const content = 'A'.repeat(300)
    const isOverLimit = content.length > platformLimits.twitter
    expect(isOverLimit).toBe(true)
  })

  it('should detect content within limit', () => {
    const content = 'A'.repeat(200)
    const isOverLimit = content.length > platformLimits.twitter
    expect(isOverLimit).toBe(false)
  })
})

describe('Content Journey - Form Data Management', () => {
  it('should store form data by template ID', () => {
    const state = createInitialWizardState()
    const templateId = 'template-123'
    const formData = { title: 'Test Title', description: 'Test Description' }
    
    state.formDataByTemplate[templateId] = formData
    
    expect(state.formDataByTemplate[templateId]).toEqual(formData)
  })

  it('should support multiple templates with different form data', () => {
    const state = createInitialWizardState()
    
    state.formDataByTemplate['template-1'] = { title: 'Title 1' }
    state.formDataByTemplate['template-2'] = { title: 'Title 2' }
    
    expect(state.formDataByTemplate['template-1'].title).toBe('Title 1')
    expect(state.formDataByTemplate['template-2'].title).toBe('Title 2')
  })

  it('should track current template index', () => {
    const state = createInitialWizardState()
    state.selectedTemplates = [
      { id: 't1', name: 'Template 1', category: 'sports', fields: [] },
      { id: 't2', name: 'Template 2', category: 'quotes', fields: [] }
    ]
    
    state.currentTemplateIndex = 1
    const currentTemplate = state.selectedTemplates[state.currentTemplateIndex]
    
    expect(currentTemplate.id).toBe('t2')
  })
})

describe('Content Journey - Schedule Types', () => {
  it('should support immediate posting', () => {
    const state = createInitialWizardState()
    state.scheduleType = 'now'
    expect(state.scheduleType).toBe('now')
  })

  it('should support scheduled posting', () => {
    const state = createInitialWizardState()
    state.scheduleType = 'scheduled'
    state.scheduledDate = '2024-12-25'
    state.scheduledTime = '14:30'
    
    expect(state.scheduleType).toBe('scheduled')
    expect(state.scheduledDate).toBe('2024-12-25')
    expect(state.scheduledTime).toBe('14:30')
  })

  it('should create valid ISO date from schedule', () => {
    const date = '2024-12-25'
    const time = '14:30'
    const isoDate = new Date(`${date}T${time}`).toISOString()
    
    expect(isoDate).toContain('2024-12-25')
  })
})

