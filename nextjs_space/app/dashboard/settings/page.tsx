
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import {
  Settings,
  User,
  Instagram,
  Linkedin,
  Twitter,
  MessageSquare,
  Check,
  X,
  ExternalLink,
  Shield,
  Bell,
  Palette,
  Plus,
  Edit,
  Trash2,
  Users as UsersIcon,
  RefreshCw
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Profile {
  id: string
  name: string
  description: string | null
  lateProfileId: string | null
  isDefault: boolean
  platformSettings: PlatformSetting[]
  createdAt: string
  updatedAt: string
}

interface PlatformSetting {
  id: string
  platform: string
  platformId: string
  isConnected: boolean
  isActive: boolean
  settings?: any
  createdAt: string
  updatedAt: string
}

const platforms = [
  { 
    id: 'instagram', 
    label: 'Instagram', 
    icon: Instagram,
    description: 'Share photos, videos, and stories',
    color: 'from-purple-500 to-pink-500'
  },
  { 
    id: 'facebook', 
    label: 'Facebook', 
    icon: MessageSquare,
    description: 'Connect with friends and share updates',
    color: 'from-blue-500 to-blue-600'
  },
  { 
    id: 'linkedin', 
    label: 'LinkedIn', 
    icon: Linkedin,
    description: 'Professional networking and content',
    color: 'from-blue-600 to-blue-700'
  },
  { 
    id: 'twitter', 
    label: 'X (Twitter)', 
    icon: Twitter,
    description: 'Share posts and engage in conversations',
    color: 'from-gray-800 to-black'
  },
  { 
    id: 'threads', 
    label: 'Threads', 
    icon: MessageSquare,
    description: 'Text-based conversations from Instagram',
    color: 'from-purple-600 to-pink-600'
  },
  { 
    id: 'tiktok', 
    label: 'TikTok', 
    icon: MessageSquare,
    description: 'Short-form videos and creative content',
    color: 'from-black to-gray-800'
  },
  { 
    id: 'bluesky', 
    label: 'Bluesky', 
    icon: MessageSquare,
    description: 'Decentralized social networking',
    color: 'from-blue-400 to-sky-500'
  },
  { 
    id: 'youtube', 
    label: 'YouTube', 
    icon: MessageSquare,
    description: 'Video content and community posts',
    color: 'from-red-500 to-red-600'
  }
]

export default function SettingsPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null)
  const [platformSettings, setPlatformSettings] = useState<PlatformSetting[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showCreateProfileDialog, setShowCreateProfileDialog] = useState(false)
  const [showEditProfileDialog, setShowEditProfileDialog] = useState(false)
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null)
  const [newProfileName, setNewProfileName] = useState('')
  const [newProfileDescription, setNewProfileDescription] = useState('')
  const [newProfileLateId, setNewProfileLateId] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    fetchProfiles()
  }, [])

  const fetchProfiles = async () => {
    try {
      const response = await fetch('/api/profiles')
      if (response.ok) {
        const data = await response.json()
        setProfiles(data.profiles || [])
        
        // Select default profile or first profile
        const defaultProfile = data.profiles.find((p: Profile) => p.isDefault)
        const profileToSelect = defaultProfile || data.profiles[0]
        if (profileToSelect) {
          setSelectedProfile(profileToSelect)
          setPlatformSettings(profileToSelect.platformSettings || [])
        }
      }
    } catch (error) {
      console.error('Failed to fetch profiles:', error)
      toast({
        title: 'Error',
        description: 'Failed to load profiles',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const openEditDialog = (profile: Profile) => {
    setEditingProfile(profile)
    setNewProfileName(profile.name)
    setNewProfileDescription(profile.description || '')
    setNewProfileLateId(profile.lateProfileId || '')
    setShowEditProfileDialog(true)
  }

  const createProfile = async () => {
    if (!newProfileName.trim()) {
      toast({
        title: 'Error',
        description: 'Profile name is required',
        variant: 'destructive'
      })
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProfileName.trim(),
          description: newProfileDescription.trim() || null,
          lateProfileId: newProfileLateId.trim() || null,
          isDefault: profiles.length === 0
        })
      })

      if (response.ok) {
        const data = await response.json()
        await fetchProfiles()
        setShowCreateProfileDialog(false)
        setNewProfileName('')
        setNewProfileDescription('')
        setNewProfileLateId('')
        toast({
          title: 'Profile Created',
          description: `${newProfileName} profile has been created successfully.`
        })
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create profile')
      }
    } catch (error: any) {
      console.error('Create profile error:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to create profile',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const updateProfile = async () => {
    if (!editingProfile) return
    
    if (!newProfileName.trim()) {
      toast({
        title: 'Error',
        description: 'Profile name is required',
        variant: 'destructive'
      })
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch('/api/profiles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: editingProfile.id,
          name: newProfileName.trim(),
          description: newProfileDescription.trim() || null,
          lateProfileId: newProfileLateId.trim() || null
        })
      })

      if (response.ok) {
        await fetchProfiles()
        setShowEditProfileDialog(false)
        setEditingProfile(null)
        setNewProfileName('')
        setNewProfileDescription('')
        setNewProfileLateId('')
        toast({
          title: 'Profile Updated',
          description: 'Profile has been updated successfully.'
        })
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update profile')
      }
    } catch (error: any) {
      console.error('Update profile error:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const deleteProfile = async (profileId: string) => {
    if (!confirm('Are you sure you want to delete this profile? All connected platforms will be removed.')) {
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch(`/api/profiles?profileId=${profileId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchProfiles()
        toast({
          title: 'Profile Deleted',
          description: 'Profile has been deleted successfully.'
        })
      } else {
        throw new Error('Failed to delete profile')
      }
    } catch (error) {
      console.error('Delete profile error:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete profile',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const selectProfile = async (profile: Profile) => {
    setSelectedProfile(profile)
    setPlatformSettings(profile.platformSettings || [])
    
    // Auto-sync with Late if profile has a Late ID
    if (profile.lateProfileId) {
      // Wait a bit for the UI to update before syncing
      setTimeout(async () => {
        try {
          const response = await fetch(`/api/late/accounts?profileId=${profile.id}`)
          if (response.ok) {
            const data = await response.json()
            const lateAccounts = data.accounts || []
            
            // Only auto-sync if there are accounts
            if (lateAccounts.length > 0) {
              // Sync in background without showing loading state
              const platformMap: { [key: string]: string } = {
                'instagram': 'instagram',
                'facebook': 'facebook',
                'twitter': 'twitter',
                'x': 'twitter',
                'linkedin': 'linkedin',
                'tiktok': 'tiktok',
                'youtube': 'youtube',
                'threads': 'threads',
                'bluesky': 'bluesky'
              }

              const updatePromises = Object.keys(platformMap).map(async (lateType) => {
                const platformId = platformMap[lateType]
                
                // Find the Late account for this platform
                const lateAccount = lateAccounts.find((acc: any) => 
                  (acc.type?.toLowerCase() === lateType.toLowerCase() || 
                   acc.platform?.toLowerCase() === lateType.toLowerCase()) &&
                  acc.isActive !== false
                )
                
                const isConnected = !!lateAccount
                const lateAccountId = lateAccount?._id || lateAccount?.id
                
                return fetch('/api/platforms', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    profileId: profile.id,
                    platform: platformId,
                    isConnected,
                    isActive: isConnected,
                    platformId: lateAccountId // Store the Late account ID
                  })
                })
              })

              await Promise.all(updatePromises)
              await fetchProfiles()
              
              // Update UI
              const updatedProfile = profiles.find(p => p.id === profile.id)
              if (updatedProfile) {
                setSelectedProfile(updatedProfile)
                setPlatformSettings(updatedProfile.platformSettings || [])
              }
            }
          }
        } catch (error) {
          console.error('Auto-sync error:', error)
        }
      }, 500)
    }
  }

  const updatePlatformSetting = async (platform: string, updates: Partial<PlatformSetting>) => {
    if (!selectedProfile) return

    setIsSaving(true)
    try {
      const response = await fetch('/api/platforms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          profileId: selectedProfile.id,
          platform, 
          ...updates 
        })
      })

      if (response.ok) {
        await fetchProfiles()
        // Update selected profile with latest data
        const updatedProfile = profiles.find(p => p.id === selectedProfile.id)
        if (updatedProfile) {
          setSelectedProfile(updatedProfile)
          setPlatformSettings(updatedProfile.platformSettings || [])
        }
        toast({
          title: 'Settings Updated',
          description: `${platform} settings have been updated successfully.`
        })
      } else {
        throw new Error('Failed to update settings')
      }
    } catch (error) {
      console.error('Update error:', error)
      toast({
        title: 'Error',
        description: 'Failed to update platform settings',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const syncWithLate = async () => {
    if (!selectedProfile) {
      toast({
        title: 'No Profile Selected',
        description: 'Please select a profile first',
        variant: 'destructive'
      })
      return
    }

    if (!selectedProfile.lateProfileId) {
      toast({
        title: 'Late Profile ID Missing',
        description: 'Please add a Late Profile ID in profile settings first',
        variant: 'destructive'
      })
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch(`/api/late/accounts?profileId=${selectedProfile.id}`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to sync with Late')
      }

      const data = await response.json()
      const lateAccounts = data.accounts || []

      // Map Late accounts to platform IDs
      const platformMap: { [key: string]: string } = {
        'instagram': 'instagram',
        'facebook': 'facebook',
        'twitter': 'twitter',
        'x': 'twitter',
        'linkedin': 'linkedin',
        'tiktok': 'tiktok',
        'youtube': 'youtube',
        'threads': 'threads',
        'bluesky': 'bluesky'
      }

      // Update platform connections based on Late accounts
      const updatePromises = Object.keys(platformMap).map(async (lateType) => {
        const platformId = platformMap[lateType]
        
        // Find the Late account for this platform
        const lateAccount = lateAccounts.find((acc: any) => 
          (acc.type?.toLowerCase() === lateType.toLowerCase() || 
           acc.platform?.toLowerCase() === lateType.toLowerCase()) &&
          acc.isActive !== false
        )
        
        const isConnected = !!lateAccount
        const lateAccountId = lateAccount?._id || lateAccount?.id
        
        return fetch('/api/platforms', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            profileId: selectedProfile.id,
            platform: platformId,
            isConnected,
            isActive: isConnected,
            platformId: lateAccountId // Store the Late account ID
          })
        })
      })

      await Promise.all(updatePromises)
      await fetchProfiles()

      // Update selected profile
      const updatedProfile = profiles.find(p => p.id === selectedProfile.id)
      if (updatedProfile) {
        setSelectedProfile(updatedProfile)
        setPlatformSettings(updatedProfile.platformSettings || [])
      }

      toast({
        title: 'Sync Complete',
        description: `Found ${lateAccounts.length} connected account(s) from Late`
      })
    } catch (error: any) {
      console.error('Sync error:', error)
      toast({
        title: 'Sync Failed',
        description: error.message || 'Failed to sync with Late',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const connectPlatform = (platformId: string) => {
    if (!selectedProfile?.lateProfileId) {
      toast({
        title: 'Late Profile Required',
        description: 'Please add a Late Profile ID and sync to connect platforms',
        variant: 'destructive'
      })
      return
    }
    
    toast({
      title: 'Use Sync Instead',
      description: 'Click "Sync with Late" to connect platforms from your Late account',
    })
  }

  const disconnectPlatform = (platformId: string) => {
    updatePlatformSetting(platformId, { isConnected: false, isActive: false })
  }

  const togglePlatformActive = (platformId: string, isActive: boolean) => {
    updatePlatformSetting(platformId, { isActive })
  }

  const getPlatformSetting = (platformId: string) => {
    return platformSettings.find(p => p.platform === platformId)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your profiles and platform integrations</p>
      </div>

      <Tabs defaultValue="platforms" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="platforms">Platforms</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        {/* Platforms Tab */}
        <TabsContent value="platforms" className="space-y-6">
          {/* Profile Management Card */}
          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Profiles</CardTitle>
                  <CardDescription>
                    Manage different sets of social media accounts for your brands or teams
                  </CardDescription>
                </div>
                <Dialog open={showCreateProfileDialog} onOpenChange={setShowCreateProfileDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      New Profile
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Profile</DialogTitle>
                      <DialogDescription>
                        Create a new profile to manage a separate set of social media accounts
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="profile-name">Profile Name *</Label>
                        <Input
                          id="profile-name"
                          placeholder="e.g., Rise As One, Basketball Factory"
                          value={newProfileName}
                          onChange={(e) => setNewProfileName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="profile-description">Description (Optional)</Label>
                        <Input
                          id="profile-description"
                          placeholder="Brief description of this profile"
                          value={newProfileDescription}
                          onChange={(e) => setNewProfileDescription(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="profile-late-id">Late Profile ID (Optional)</Label>
                        <Input
                          id="profile-late-id"
                          placeholder="e.g., 68f68213a24dabbd5b9da3fe"
                          value={newProfileLateId}
                          onChange={(e) => setNewProfileLateId(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          Enter your Late app profile ID from{' '}
                          <a 
                            href="https://getlate.dev/accounts" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline"
                          >
                            getlate.dev/accounts
                          </a>
                        </p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button 
                        variant="outline" 
                        onClick={() => setShowCreateProfileDialog(false)}
                        disabled={isSaving}
                      >
                        Cancel
                      </Button>
                      <Button onClick={createProfile} disabled={isSaving}>
                        {isSaving ? 'Creating...' : 'Create Profile'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                {/* Edit Profile Dialog */}
                <Dialog open={showEditProfileDialog} onOpenChange={setShowEditProfileDialog}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Profile</DialogTitle>
                      <DialogDescription>
                        Update profile information and Late profile ID
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-profile-name">Profile Name *</Label>
                        <Input
                          id="edit-profile-name"
                          placeholder="e.g., Rise As One, Basketball Factory"
                          value={newProfileName}
                          onChange={(e) => setNewProfileName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-profile-description">Description (Optional)</Label>
                        <Input
                          id="edit-profile-description"
                          placeholder="Brief description of this profile"
                          value={newProfileDescription}
                          onChange={(e) => setNewProfileDescription(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-profile-late-id">Late Profile ID (Optional)</Label>
                        <Input
                          id="edit-profile-late-id"
                          placeholder="e.g., 68f68213a24dabbd5b9da3fe"
                          value={newProfileLateId}
                          onChange={(e) => setNewProfileLateId(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          Enter your Late app profile ID from{' '}
                          <a 
                            href="https://getlate.dev/accounts" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline"
                          >
                            getlate.dev/accounts
                          </a>
                        </p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setShowEditProfileDialog(false)
                          setEditingProfile(null)
                          setNewProfileName('')
                          setNewProfileDescription('')
                          setNewProfileLateId('')
                        }}
                        disabled={isSaving}
                      >
                        Cancel
                      </Button>
                      <Button onClick={updateProfile} disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-12 bg-gray-200 rounded"></div>
                  <div className="h-12 bg-gray-200 rounded"></div>
                </div>
              ) : profiles.length === 0 ? (
                <Alert>
                  <UsersIcon className="h-4 w-4" />
                  <AlertDescription>
                    No profiles found. Create your first profile to get started.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3">
                  {profiles.map((profile) => (
                    <div
                      key={profile.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        selectedProfile?.id === profile.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                      onClick={() => selectProfile(profile)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                            <UsersIcon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-medium flex items-center space-x-2">
                              <span>{profile.name}</span>
                              {profile.isDefault && (
                                <Badge variant="secondary" className="text-xs">Default</Badge>
                              )}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {profile.description || 'No description'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {profile.platformSettings.length} platform{profile.platformSettings.length !== 1 ? 's' : ''} connected
                            </p>
                            {profile.lateProfileId && (
                              <p className="text-xs text-gray-400 font-mono">
                                Late ID: {profile.lateProfileId.substring(0, 8)}...
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              openEditDialog(profile)
                            }}
                            disabled={isSaving}
                          >
                            <Edit className="w-4 h-4 text-blue-500" />
                          </Button>
                          {profiles.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteProfile(profile.id)
                              }}
                              disabled={isSaving}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Connected Platforms</CardTitle>
                  <CardDescription>
                    {selectedProfile 
                      ? `Managing platforms for ${selectedProfile.name}`
                      : 'Select a profile to manage platform connections'
                    }
                  </CardDescription>
                </div>
                {selectedProfile && selectedProfile.lateProfileId && (
                  <Button 
                    onClick={syncWithLate} 
                    disabled={isSaving}
                    size="sm"
                    variant="outline"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isSaving ? 'animate-spin' : ''}`} />
                    Sync with Late
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!selectedProfile ? (
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    Please select a profile above to manage platform connections.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  {selectedProfile.lateProfileId ? (
                    <Alert className="mb-6">
                      <Shield className="h-4 w-4" />
                      <AlertDescription>
                        Platform connections are synced from Late API. Click "Sync with Late" to update your connected platforms.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert className="mb-6 border-yellow-200 bg-yellow-50">
                      <Shield className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-800">
                        No Late Profile ID configured. Please edit this profile and add your Late Profile ID from{' '}
                        <a 
                          href="https://getlate.dev/accounts" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="underline font-medium"
                        >
                          getlate.dev/accounts
                        </a>
                      </AlertDescription>
                    </Alert>
                  )}

              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="animate-pulse h-20 bg-gray-200 rounded-lg"></div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {platforms.map((platform) => {
                    const setting = getPlatformSetting(platform.id)
                    const isConnected = setting?.isConnected ?? false
                    const isActive = setting?.isActive ?? false
                    
                    return (
                      <div key={platform.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${platform.color} flex items-center justify-center`}>
                              <platform.icon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className="font-medium flex items-center space-x-2">
                                <span>{platform.label}</span>
                                {isConnected ? (
                                  <Badge className="bg-green-100 text-green-800 text-xs">
                                    <Check className="w-3 h-3 mr-1" />
                                    Connected
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="text-xs">
                                    Not Connected
                                  </Badge>
                                )}
                              </h3>
                              <p className="text-sm text-gray-600">{platform.description}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            {isConnected && (
                              <div className="flex items-center space-x-2">
                                <Label htmlFor={`${platform.id}-active`} className="text-sm">Active</Label>
                                <Switch
                                  id={`${platform.id}-active`}
                                  checked={isActive}
                                  onCheckedChange={(checked) => togglePlatformActive(platform.id, checked)}
                                  disabled={isSaving}
                                />
                              </div>
                            )}
                            
                            {isConnected ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => disconnectPlatform(platform.id)}
                                disabled={isSaving}
                              >
                                Disconnect
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => connectPlatform(platform.id)}
                                disabled={isSaving}
                              >
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Connect
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        {isConnected && !isActive && (
                          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-700">
                            This platform is connected but not active. Enable it to include in posting.
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
                </>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Late API Configuration</CardTitle>
              <CardDescription>
                Your Late API integration status and settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-green-900">Late API Connected</h4>
                    <p className="text-sm text-green-700">Your API key is configured and ready for use</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://getlate.dev/docs" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Docs
                  </a>
                </Button>
              </div>
              
              <div className="text-sm text-gray-600">
                <p><strong>API Endpoint:</strong> https://api.getlate.dev</p>
                <p><strong>Supported Platforms:</strong> Instagram, LinkedIn, TikTok, YouTube, Twitter, and more</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                Manage your account details and security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" placeholder="your@email.com" disabled />
                <p className="text-xs text-gray-500">Email changes require verification</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="name">Display Name</Label>
                <Input id="name" type="text" placeholder="Your Name" />
              </div>
              
              <Button>Update Account</Button>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>
                Keep your account secure with these settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input id="current-password" type="password" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input id="new-password" type="password" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input id="confirm-password" type="password" />
              </div>
              
              <Button variant="outline">Change Password</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                Control when and how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="post-notifications">Post Notifications</Label>
                  <p className="text-sm text-gray-500">Get notified when posts are published successfully</p>
                </div>
                <Switch id="post-notifications" defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="error-notifications">Error Notifications</Label>
                  <p className="text-sm text-gray-500">Get notified when posts fail to publish</p>
                </div>
                <Switch id="error-notifications" defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="weekly-reports">Weekly Reports</Label>
                  <p className="text-sm text-gray-500">Receive weekly analytics summaries</p>
                </div>
                <Switch id="weekly-reports" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Content Generation</CardTitle>
              <CardDescription>
                Customize your AI content generation preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="default-tone">Default Tone</Label>
                <Input id="default-tone" placeholder="e.g., professional, casual, friendly" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="default-topic">Default Topic</Label>
                <Input id="default-topic" placeholder="e.g., Technology, Business, Lifestyle" />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="save-generated">Auto-save Generated Content</Label>
                  <p className="text-sm text-gray-500">Automatically save all generated content for future use</p>
                </div>
                <Switch id="save-generated" defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
