import { describe, it, expect } from 'vitest'
import {
  evaluateToolRecommendation,
  detectCrossToolRedundancy,
  type AuditToolInput,
  type AuditContext,
} from '../src/engine/recommendations'

describe('recommendations.ts - Primary Use Cases', () => {
  describe('Seat Overprovision Detection', () => {
    it('should detect seat overprovision on Cursor', () => {
      const input: AuditToolInput = {
        toolId: 'cursor',
        planId: 'pro',
        seats: 10,
        reportedMonthlySpend: 200,
        currentSpend: 200,
        resolvedSpend: 200,
        usageRatio: 0.5,
      }

      const context: AuditContext = {
        teamSize: 5,
        useCase: 'coding',
        tools: [input],
      }

      const result = evaluateToolRecommendation(input, context)
      expect(result.action).toBe('seat-overprovision')
      expect(result.monthlySavings).toBeGreaterThan(0)
      expect(result.flags).toContain('seat-overprovision')
    })

    it('should detect seat overprovision on ChatGPT', () => {
      const input: AuditToolInput = {
        toolId: 'chatgpt',
        planId: 'business-annual',
        seats: 15,
        reportedMonthlySpend: 324,
        currentSpend: 324,
        resolvedSpend: 324,
        usageRatio: 0.3,
      }

      const context: AuditContext = {
        teamSize: 8,
        useCase: 'mixed',
        tools: [input],
      }

      const result = evaluateToolRecommendation(input, context)
      expect(result.action).toBe('seat-overprovision')
      expect(result.monthlySavings).toBeGreaterThan(0)
    })

    it('should not flag when seats match team size', () => {
      const input: AuditToolInput = {
        toolId: 'cursor',
        planId: 'pro',
        seats: 5,
        reportedMonthlySpend: 100,
        currentSpend: 100,
        resolvedSpend: 100,
        usageRatio: 0.8,
      }

      const context: AuditContext = {
        teamSize: 5,
        useCase: 'coding',
        tools: [input],
      }

      const result = evaluateToolRecommendation(input, context)
      expect(result.action).not.toBe('seat-overprovision')
    })
  })

  describe('Wrong Use-Case Detection', () => {
    it('should flag Cursor for non-coding team', () => {
      const input: AuditToolInput = {
        toolId: 'cursor',
        planId: 'pro',
        seats: 5,
        reportedMonthlySpend: 100,
        currentSpend: 100,
        resolvedSpend: 100,
        usageRatio: 0.2,
      }

      const context: AuditContext = {
        teamSize: 5,
        useCase: 'research',
        tools: [input],
      }

      const result = evaluateToolRecommendation(input, context)
      expect(result.action).toBe('wrong-use-case')
      expect(result.flags).toContain('wrong-use-case')
    })

    it('should not flag coding tools for coding teams', () => {
      const input: AuditToolInput = {
        toolId: 'windsurf',
        planId: 'pro',
        seats: 5,
        reportedMonthlySpend: 100,
        currentSpend: 100,
        resolvedSpend: 100,
        usageRatio: 0.7,
      }

      const context: AuditContext = {
        teamSize: 5,
        useCase: 'coding',
        tools: [input],
      }

      const result = evaluateToolRecommendation(input, context)
      expect(result.action).not.toBe('wrong-use-case')
    })
  })

  describe('Org Feature Tax Detection', () => {
    it('should detect org feature tax on Cursor Teams', () => {
      const input: AuditToolInput = {
        toolId: 'cursor',
        planId: 'teams',
        seats: 2,
        reportedMonthlySpend: 80,
        currentSpend: 80,
        resolvedSpend: 80,
        usageRatio: 0.6,
      }

      const context: AuditContext = {
        teamSize: 2,
        useCase: 'coding',
        tools: [input],
      }

      const result = evaluateToolRecommendation(input, context)
      expect(result.action).toBe('org-feature-tax')
      expect(result.monthlySavings).toBeGreaterThan(0)
    })
  })

  describe('Billing Switch Recommendations', () => {
    it('should recommend annual billing for ChatGPT Business', () => {
      const input: AuditToolInput = {
        toolId: 'chatgpt',
        planId: 'business-monthly',
        seats: 5,
        reportedMonthlySpend: 135.5,
        currentSpend: 135.5,
        resolvedSpend: 135.5,
        usageRatio: 0.7,
      }

      const context: AuditContext = {
        teamSize: 5,
        useCase: 'mixed',
        tools: [input],
      }

      const result = evaluateToolRecommendation(input, context)
      expect(result.action).toBe('billing-switch')
      expect(result.monthlySavings).toBeGreaterThan(0)
    })
  })

  describe('Cross-Tool Redundancy Detection', () => {
    it('should detect redundancy for 3+ coding tools on small team', () => {
      const context: AuditContext = {
        teamSize: 2,
        useCase: 'coding',
        tools: [
          {
            toolId: 'cursor',
            planId: 'pro',
            seats: 2,
            reportedMonthlySpend: 40,
            currentSpend: 40,
            resolvedSpend: 40,
            usageRatio: 0.5,
          },
          {
            toolId: 'github-copilot',
            planId: 'pro',
            seats: 2,
            reportedMonthlySpend: 20,
            currentSpend: 20,
            resolvedSpend: 20,
            usageRatio: 0.3,
          },
          {
            toolId: 'windsurf',
            planId: 'pro',
            seats: 2,
            reportedMonthlySpend: 40,
            currentSpend: 40,
            resolvedSpend: 40,
            usageRatio: 0.2,
          },
        ],
      }

      const result = detectCrossToolRedundancy(context)
      expect(result.redundant).toBe(true)
      expect(result.codingToolCount).toBe(3)
    })
  })

  describe('Optimal Recommendations', () => {
    it('should return optimal when right-sized', () => {
      const input: AuditToolInput = {
        toolId: 'cursor',
        planId: 'pro',
        seats: 5,
        reportedMonthlySpend: 100,
        currentSpend: 100,
        resolvedSpend: 100,
        usageRatio: 0.8,
      }

      const context: AuditContext = {
        teamSize: 5,
        useCase: 'coding',
        tools: [input],
      }

      const result = evaluateToolRecommendation(input, context)
      expect(result.action).toBe('optimal')
      expect(result.isOptimal).toBe(true)
    })
  })

  describe('Result Structure Validation', () => {
    it('should return valid ToolRecommendation structure', () => {
      const input: AuditToolInput = {
        toolId: 'cursor',
        planId: 'pro',
        seats: 5,
        reportedMonthlySpend: 100,
        currentSpend: 100,
        resolvedSpend: 100,
        usageRatio: 0.8,
      }

      const context: AuditContext = {
        teamSize: 5,
        useCase: 'coding',
        tools: [input],
      }

      const result = evaluateToolRecommendation(input, context)
      expect(result).toHaveProperty('toolId')
      expect(result).toHaveProperty('monthlySavings')
      expect(result).toHaveProperty('action')
      expect(result).toHaveProperty('flags')
      expect(Array.isArray(result.flags)).toBe(true)
    })
  })
})
