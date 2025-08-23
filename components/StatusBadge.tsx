'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react'

interface StatusBadgeProps {
  status: 'valid' | 'invalid' | 'expired' | 'error'
  size?: 'sm' | 'md' | 'lg'
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'valid':
        return {
          icon: CheckCircle,
          text: 'Valid',
          className: 'bg-green-100 text-green-800 border-green-200'
        }
      case 'invalid':
        return {
          icon: XCircle,
          text: 'Invalid',
          className: 'bg-red-100 text-red-800 border-red-200'
        }
      case 'expired':
        return {
          icon: Clock,
          text: 'Expired',
          className: 'bg-orange-100 text-orange-800 border-orange-200'
        }
      case 'error':
        return {
          icon: AlertTriangle,
          text: 'Error',
          className: 'bg-red-100 text-red-800 border-red-200'
        }
      default:
        return {
          icon: AlertTriangle,
          text: 'Unknown',
          className: 'bg-gray-100 text-gray-800 border-gray-200'
        }
    }
  }

  const config = getStatusConfig()
  const Icon = config.icon
  
  const iconSize = size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'

  return (
    <Badge className={config.className}>
      <Icon className={`${iconSize} mr-1`} />
      {config.text}
    </Badge>
  )
}