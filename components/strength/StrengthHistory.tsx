'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Trash2 } from 'lucide-react'
import { deleteStrengthRecord, type StrengthRecord } from '@/lib/strength-service'

interface StrengthHistoryProps {
  records: StrengthRecord[]
  onRecordDeleted: () => void
}

export function StrengthHistory({ records, onRecordDeleted }: StrengthHistoryProps) {
  const handleDelete = (id: string) => {
    if (deleteStrengthRecord(id)) {
      onRecordDeleted()
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (records.length === 0) {
    return (
      <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-8 text-center">
        <p className="text-[#A5A5A5]">No records yet. Log your first lift!</p>
      </Card>
    )
  }

  return (
    <Card className="bg-[#2A2A2A] border-[#3A3A3A] overflow-hidden">
      <div className="p-4 border-b border-[#3A3A3A]">
        <h3 className="text-lg font-semibold">History</h3>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="border-[#3A3A3A] hover:bg-transparent">
            <TableHead className="text-[#A5A5A5]">Date</TableHead>
            <TableHead className="text-[#A5A5A5]">Weight</TableHead>
            <TableHead className="text-[#A5A5A5]">Reps</TableHead>
            <TableHead className="text-[#A5A5A5]">Est 1RM</TableHead>
            <TableHead className="text-[#A5A5A5] w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <TableRow key={record.id} className="border-[#3A3A3A] hover:bg-[#1A1A1A]">
              <TableCell className="text-[#F5F5F5]">
                {formatDate(record.dateLogged)}
              </TableCell>
              <TableCell className="text-[#F5F5F5]">
                +{record.weightAdded} lbs
              </TableCell>
              <TableCell className="text-[#F5F5F5]">
                {record.reps}
              </TableCell>
              <TableCell className="text-[#E63946] font-semibold">
                +{record.estimatedOneRM} lbs
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(record.id)}
                  className="h-8 w-8 text-[#A5A5A5] hover:text-[#E63946] hover:bg-[#3A3A3A]"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}
