'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { CheckCircle, XCircle, RefreshCw, Eye, EyeOff, Trash2, Plus } from 'lucide-react'
import { AIProvider, providers } from '@/lib/ai-config'
import { ApiKeyService, ApiKey } from '@/lib/api-key-service'
import { format } from 'date-fns'

interface ApiKeyManagerProps {
  initialApiKeys: ApiKey[]
  userId: string
}

export default function ApiKeyManager({ initialApiKeys, userId }: ApiKeyManagerProps) {
  const router = useRouter()
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(initialApiKeys)
  const [isAddingKey, setIsAddingKey] = useState(false)
  const [addKeyLoading, setAddKeyLoading] = useState(false)
  const [showKeyValue, setShowKeyValue] = useState<Record<string, boolean>>({})
  const [newKey, setNewKey] = useState({
    provider: 'openai' as AIProvider,
    name: '',
    apiKey: ''
  })
  const [error, setError] = useState<string | null>(null)
  const [testingKey, setTestingKey] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<boolean | null>(null)

  const toggleKeyVisibility = (keyId: string) => {
    setShowKeyValue(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }))
  }
  
  const handleProviderChange = (provider: string) => {
    setNewKey(prev => ({
      ...prev,
      provider: provider as AIProvider,
      name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} API Key`
    }))
  }
  
  const resetForm = () => {
    setNewKey({
      provider: 'openai' as AIProvider,
      name: '',
      apiKey: ''
    })
    setError(null)
    setTestResult(null)
  }
  
  const handleAddKey = async () => {
    setError(null)
    setAddKeyLoading(true)
    
    try {
      if (!newKey.provider || !newKey.name || !newKey.apiKey) {
        throw new Error('All fields are required')
      }
      
      // Add the new key
      const createdKey = await ApiKeyService.createApiKey(
        userId,
        newKey.provider as AIProvider,
        newKey.name,
        newKey.apiKey
      )
      
      // Update the UI
      setApiKeys([createdKey, ...apiKeys])
      setIsAddingKey(false)
      resetForm()
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to add API key')
    } finally {
      setAddKeyLoading(false)
    }
  }
  
  const handleDeleteKey = async (keyId: string) => {
    try {
      await ApiKeyService.deleteApiKey(keyId)
      setApiKeys(apiKeys.filter(key => key.id !== keyId))
      router.refresh()
    } catch (err: any) {
      console.error('Error deleting key:', err)
      // Could show an error message here
    }
  }
  
  const handleTestKey = async (keyId: string, provider: string, apiKey: string) => {
    setTestingKey(keyId)
    setTestResult(null)
    
    try {
      const result = await ApiKeyService.testApiKey(provider as AIProvider, apiKey)
      setTestResult(result)
    } catch (err) {
      setTestResult(false)
    } finally {
      // Reset after a delay
      setTimeout(() => {
        setTestingKey(null)
        setTestResult(null)
      }, 3000)
    }
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">Your API Keys</h2>
        <Button onClick={() => setIsAddingKey(true)} variant="default" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add New API Key
        </Button>
      </div>
      
      {apiKeys.length === 0 ? (
        <div className="text-center py-8 border rounded-lg">
          <p className="text-muted-foreground">You haven't added any API keys yet.</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-4" 
            onClick={() => setIsAddingKey(true)}
          >
            Add Your First API Key
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>API Key</TableHead>
                <TableHead>Added</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiKeys.map(key => (
                <TableRow key={key.id}>
                  <TableCell className="font-medium">{key.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {key.provider}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <span className="font-mono text-xs">
                        {showKeyValue[key.id] 
                          ? '*****' // Use actual value in real app, but decrypt first
                          : '*****'}
                      </span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="ml-2 h-6 w-6 p-0"
                        onClick={() => toggleKeyVisibility(key.id)}
                      >
                        {showKeyValue[key.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {format(new Date(key.created_at), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    {testingKey === key.id ? (
                      <div className="flex items-center">
                        {testResult === null ? (
                          <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                        ) : testResult ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    ) : (
                      <Badge variant={key.is_active ? "default" : "secondary"} className={key.is_active ? "bg-green-500" : ""}>
                        {key.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleTestKey(key.id, key.provider, '*****')} // Use actual key in real app
                        disabled={testingKey !== null}
                      >
                        Test
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete API Key</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this API key? 
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteKey(key.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      
      {/* Add API Key Dialog */}
      <Dialog open={isAddingKey} onOpenChange={setIsAddingKey}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New API Key</DialogTitle>
            <DialogDescription>
              Enter your API key for the selected provider.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="provider">Provider</Label>
              <Select 
                value={newKey.provider} 
                onValueChange={handleProviderChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(providers).map(([key, provider]) => (
                    <SelectItem key={key} value={key}>
                      {provider.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input 
                id="name" 
                value={newKey.name}
                onChange={e => setNewKey(prev => ({ ...prev, name: e.target.value }))}
                placeholder="My OpenAI Key"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input 
                id="apiKey" 
                type="password"
                value={newKey.apiKey}
                onChange={e => setNewKey(prev => ({ ...prev, apiKey: e.target.value }))}
                placeholder="sk-..."
              />
              <p className="text-xs text-muted-foreground">
                Your API key is stored securely and never shared with anyone.
              </p>
            </div>
            
            {error && (
              <div className="text-sm font-medium text-destructive">{error}</div>
            )}
          </div>
          
          <DialogFooter className="sm:justify-between">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsAddingKey(false)
                resetForm()
              }}
              disabled={addKeyLoading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddKey}
              disabled={addKeyLoading || !newKey.provider || !newKey.name || !newKey.apiKey}
            >
              {addKeyLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add API Key'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 