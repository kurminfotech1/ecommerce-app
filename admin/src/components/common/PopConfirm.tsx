import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ReactNode } from "react"

interface PopConfirmProps {
  trigger: ReactNode
  title: string
  description: string
  children: ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function PopConfirm({
  trigger,
  title,
  description,
  children,
  open,
  onOpenChange,
}: PopConfirmProps) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align="center" side="top">
        <PopoverHeader>
          <PopoverTitle>{title}</PopoverTitle>
          <PopoverDescription>{description}</PopoverDescription>
        </PopoverHeader>
        {children}
      </PopoverContent>
    </Popover>
  )
}
