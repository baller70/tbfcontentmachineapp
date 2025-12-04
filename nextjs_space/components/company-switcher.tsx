
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronsUpDown, Plus, Building2, Users, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useBranding } from '@/contexts/branding-context'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'

interface Company {
  id: string
  name: string
  description: string | null
  logoUrl: string | null
  role: string
  memberCount: number
  postCount: number
  templateCount: number
}

export function CompanySwitcher() {
  const router = useRouter()
  const { toast } = useToast()
  const { refreshBranding } = useBranding()
  const [open, setOpen] = useState(false)
  const [showNewCompanyDialog, setShowNewCompanyDialog] = useState(false)
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  const [newCompanyData, setNewCompanyData] = useState({
    name: '',
    description: ''
  })

  const selectedCompany = companies.find(c => c.id === selectedCompanyId)

  useEffect(() => {
    fetchCompanies()
  }, [])

  const fetchCompanies = async () => {
    try {
      const response = await fetch('/api/companies')
      if (!response.ok) throw new Error('Failed to fetch companies')
      
      const data = await response.json()
      setCompanies(data.companies || [])
      setSelectedCompanyId(data.selectedCompanyId)
    } catch (error) {
      console.error('Error fetching companies:', error)
      toast({
        title: 'Error',
        description: 'Failed to load companies',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSwitchCompany = async (companyId: string) => {
    if (companyId === selectedCompanyId) {
      setOpen(false)
      return
    }

    try {
      const response = await fetch('/api/companies/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId })
      })

      if (!response.ok) throw new Error('Failed to switch company')

      setSelectedCompanyId(companyId)
      setOpen(false)
      
      // Refresh branding colors for the new company
      await refreshBranding()
      
      toast({
        title: 'Success',
        description: 'Company switched successfully'
      })

      // Refresh the page to load new company data
      router.refresh()
    } catch (error) {
      console.error('Error switching company:', error)
      toast({
        title: 'Error',
        description: 'Failed to switch company',
        variant: 'destructive'
      })
    }
  }

  const handleCreateCompany = async () => {
    if (!newCompanyData.name.trim()) {
      toast({
        title: 'Error',
        description: 'Company name is required',
        variant: 'destructive'
      })
      return
    }

    setCreating(true)
    try {
      const response = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCompanyData)
      })

      if (!response.ok) throw new Error('Failed to create company')

      const { company } = await response.json()
      
      toast({
        title: 'Success',
        description: 'Company created successfully'
      })

      setNewCompanyData({ name: '', description: '' })
      setShowNewCompanyDialog(false)
      
      // Refresh companies list
      await fetchCompanies()
      
      // Switch to the new company
      await handleSwitchCompany(company.id)
    } catch (error) {
      console.error('Error creating company:', error)
      toast({
        title: 'Error',
        description: 'Failed to create company',
        variant: 'destructive'
      })
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center space-x-2 px-2">
        <Building2 className="h-5 w-5 text-gray-400 animate-pulse" />
        <span className="text-sm text-gray-400">Loading...</span>
      </div>
    )
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Select a company"
            className="w-full justify-between"
          >
            <div className="flex items-center space-x-2 truncate">
              <Building2 className="h-4 w-4 shrink-0" />
              <span className="truncate">
                {selectedCompany?.name || 'Select company...'}
              </span>
            </div>
            <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandInput placeholder="Search company..." />
            <CommandList>
              <CommandEmpty>No company found.</CommandEmpty>
              <CommandGroup heading="Your Companies">
                {companies.map((company) => (
                  <CommandItem
                    key={company.id}
                    onSelect={() => handleSwitchCompany(company.id)}
                    className="text-sm"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center space-x-2 flex-1 truncate">
                        <Building2 className="h-4 w-4 shrink-0" />
                        <div className="flex flex-col truncate">
                          <span className="truncate">{company.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {company.role}
                          </span>
                        </div>
                      </div>
                      <Check
                        className={cn(
                          'ml-2 h-4 w-4 shrink-0',
                          selectedCompanyId === company.id
                            ? 'opacity-100'
                            : 'opacity-0'
                        )}
                      />
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    setOpen(false)
                    setShowNewCompanyDialog(true)
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Company
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog open={showNewCompanyDialog} onOpenChange={setShowNewCompanyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Company</DialogTitle>
            <DialogDescription>
              Add a new company to manage your content separately.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Company Name</Label>
              <Input
                id="name"
                placeholder="Enter company name"
                value={newCompanyData.name}
                onChange={(e) => setNewCompanyData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Brief description of the company"
                value={newCompanyData.description}
                onChange={(e) => setNewCompanyData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNewCompanyDialog(false)}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateCompany}
              disabled={creating || !newCompanyData.name.trim()}
            >
              {creating ? 'Creating...' : 'Create Company'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
