'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { getITPsByProject, getITPItemsByITP } from '../../civil-q-app/lib/supabase/itps';
import type { ITP, ITPItem } from '../../civil-q-app/types/database';

interface ITPSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectITP: (itpId: string) => void;
  projectId: string;
  lotName: string;
}

export default function ITPSelectionModal({
  isOpen,
  onClose,
  onSelectITP,
  projectId,
  lotName
}: ITPSelectionModalProps) {
  const [itps, setITPs] = useState<ITP[]>([]);
  const [selectedITPId, setSelectedITPId] = useState<string>('');
  const [previewItems, setPreviewItems] = useState<ITPItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && projectId) {
      loadITPs();
    }
  }, [isOpen, projectId]);

  const loadITPs = async () => {
    try {
      setLoading(true);
      const data = await getITPsByProject(projectId);
      setITPs(data);
    } catch (error) {
      console.error('Error loading ITPs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleITPSelect = async (itpId: string) => {
    setSelectedITPId(itpId);
    try {
      const items = await getITPItemsByITP(itpId);
      setPreviewItems(items);
    } catch (error) {
      console.error('Error loading ITP items:', error);
    }
  };

  const handleConfirm = () => {
    if (selectedITPId) {
      onSelectITP(selectedITPId);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select Inspection & Test Plan</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Choose an ITP for lot: <strong>{lotName}</strong>
          </p>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <label className="text-sm font-medium">Available ITPs</label>
            <Select value={selectedITPId} onValueChange={handleITPSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select an Inspection & Test Plan" />
              </SelectTrigger>
              <SelectContent>
                {itps.map((itp) => (
                  <SelectItem key={itp.id} value={itp.id}>
                    {itp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedITPId && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">ITP Preview</CardTitle>
                <CardDescription>
                  {itps.find(i => i.id === selectedITPId)?.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {previewItems.length} inspection items
                    </Badge>
                    <Badge variant="outline">
                      {previewItems.filter(item => item.is_mandatory).length} mandatory
                    </Badge>
                  </div>
                  
                  <div className="grid gap-2 max-h-40 overflow-y-auto">
                    {previewItems.map((item) => (
                      <div key={item.id} className="flex items-center gap-2 p-2 border rounded text-sm">
                        <span className="font-mono text-xs bg-muted px-1 rounded">
                          {item.item_number}
                        </span>
                        <span className="flex-1">{item.description}</span>
                        {item.is_mandatory && (
                          <Badge variant="destructive" className="text-xs">Required</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirm} 
              disabled={!selectedITPId}
            >
              Assign ITP to Lot
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}