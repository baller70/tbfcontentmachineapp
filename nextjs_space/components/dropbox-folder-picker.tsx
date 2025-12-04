
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Folder, ChevronRight, Home, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DropboxFolder {
  id: string;
  name: string;
  path: string;
  fileCount?: number;
}

interface DropboxFolderPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFolderSelect: (folderId: string, folderPath: string, folderName: string, fileCount?: number) => void;
}

export function DropboxFolderPicker({ open, onOpenChange, onFolderSelect }: DropboxFolderPickerProps) {
  const [folders, setFolders] = useState<DropboxFolder[]>([]);
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [currentFolderFileCount, setCurrentFolderFileCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      console.log('🎯 Dropbox folder picker opened, loading root folders...');
      loadFolders('');
    }
  }, [open]);

  const loadFolders = async (parentPath: string) => {
    try {
      setLoading(true);
      console.log('📁 Loading Dropbox folders from path:', parentPath);
      
      const url = `/api/dropbox/folders?parentPath=${encodeURIComponent(parentPath)}`;
      console.log('🔗 Fetching URL:', url);
      
      const response = await fetch(url);
      console.log('📊 Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ API Error:', errorData);
        console.error('HTTP Status:', response.status);
        
        // Provide user-friendly error messages
        let errorMessage = 'Failed to load Dropbox folders';
        
        if (response.status === 401) {
          errorMessage = errorData.message || 'Dropbox connection expired. Please reconnect Dropbox using the oauth_token_manager tool.';
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log('✅ Loaded folders:', data.folders?.length || 0, 'File count:', data.currentFolderFileCount);
      
      setFolders(data.folders || []);
      setCurrentFolderFileCount(data.currentFolderFileCount || 0);
    } catch (error: any) {
      console.error('❌ Error loading Dropbox folders:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load Dropbox folders. Please try again.',
        variant: 'destructive',
      });
      // Reset state on error
      setFolders([]);
      setCurrentFolderFileCount(0);
    } finally {
      setLoading(false);
    }
  };

  const navigateToFolder = (folder: DropboxFolder) => {
    const newPath = [...currentPath, folder.name];
    setCurrentPath(newPath);
    loadFolders(folder.path);
  };

  const navigateBack = () => {
    const newPath = currentPath.slice(0, -1);
    setCurrentPath(newPath);
    const parentPath = newPath.length > 0 ? `/${newPath.join('/')}` : '';
    loadFolders(parentPath);
  };

  const navigateToRoot = () => {
    setCurrentPath([]);
    loadFolders('');
  };

  const handleSelectCurrentFolder = () => {
    const currentFolderPath = currentPath.length > 0 ? `/${currentPath.join('/')}` : '';
    const currentFolderName = currentPath.length > 0 ? currentPath[currentPath.length - 1] : 'Root';
    
    // Call with correct parameter order: folderId, folderPath, folderName, fileCount
    onFolderSelect(currentFolderPath, currentFolderPath, currentFolderName, currentFolderFileCount);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Select Dropbox Folder</DialogTitle>
          <DialogDescription>
            Choose a folder containing your images or videos for scheduled posting
          </DialogDescription>
        </DialogHeader>

        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 py-2 border-b">
          <Button
            variant="ghost"
            size="sm"
            onClick={navigateToRoot}
            disabled={loading || currentPath.length === 0}
          >
            <Home className="h-4 w-4" />
          </Button>
          
          {currentPath.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={navigateBack}
              disabled={loading}
            >
              ← Back
            </Button>
          )}
          
          <div className="flex items-center gap-1 text-sm text-muted-foreground overflow-x-auto">
            <span>Root</span>
            {currentPath.map((folder, index) => (
              <span key={index} className="flex items-center gap-1">
                <ChevronRight className="h-4 w-4" />
                <span>{folder}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Folder List */}
        <ScrollArea className="h-[400px] pr-4">
          {loading ? (
            <div className="flex items-center justify-center h-[200px]">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-2">
              {folders.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No subfolders found in this location</p>
                  {currentFolderFileCount > 0 && (
                    <p className="mt-2 text-sm">
                      This folder contains {currentFolderFileCount} file(s)
                    </p>
                  )}
                </div>
              )}
              
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => navigateToFolder(folder)}
                  className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Folder className="h-5 w-5 text-blue-500" />
                    <div className="text-left">
                      <div className="font-medium">{folder.name}</div>
                      {folder.fileCount !== undefined && folder.fileCount > 0 && (
                        <div className="text-xs text-muted-foreground">
                          {folder.fileCount} file(s)
                        </div>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </button>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Select Current Folder Button */}
        <div className="pt-4 border-t">
          <Button
            onClick={handleSelectCurrentFolder}
            disabled={loading}
            className="w-full"
          >
            Select Current Folder
            {currentFolderFileCount > 0 && (
              <span className="ml-2 text-xs opacity-75">
                ({currentFolderFileCount} file(s))
              </span>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
