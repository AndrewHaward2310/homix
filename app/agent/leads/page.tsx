'use client'

import { useEffect, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Phone } from 'lucide-react'
import type { Lead, LeadStage } from '@/types'
import { leadService } from '@/services/leadService'
import { useT } from '@/lib/i18n/provider'
import { useToast } from '@/components/ui/toast'
import { StateWrapper, type ViewState } from '@/components/ui/state-wrapper'
import { cn } from '@/lib/utils'

const STAGES: LeadStage[] = ['new', 'consulting', 'closed']
const STAGE_ACCENT: Record<LeadStage, string> = {
  new: 'bg-blue-500',
  consulting: 'bg-amber-500',
  closed: 'bg-emerald-500',
}

function LeadCard({ lead, overlay }: { lead: Lead; overlay?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: lead.id })
  const t = useT()
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={cn(
        'rounded-xl border border-border bg-card p-3.5 shadow-sm',
        isDragging && !overlay && 'opacity-40',
        overlay && 'shadow-luxury-lg',
      )}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Kéo"
          className="mt-0.5 cursor-grab text-muted-foreground active:cursor-grabbing"
        >
          <GripVertical className="size-4" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate font-sans text-[0.9rem] font-semibold text-foreground">{lead.customerName}</p>
          <p className="mt-1 line-clamp-2 font-sans text-[0.8125rem] leading-snug text-muted-foreground">
            {lead.needSummary}
          </p>
          <div className="mt-2.5 flex items-center justify-between">
            <span className="inline-flex items-center gap-1 font-sans text-[0.75rem] text-muted-foreground">
              <Phone className="size-3" /> {lead.contact}
            </span>
            {lead.matchedPropertyIds.length > 0 && (
              <span className="rounded-full bg-brand/10 px-2 py-0.5 font-sans text-[0.6875rem] font-medium text-brand">
                {lead.matchedPropertyIds.length} {t('agent.matched')}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Column({ stage, leads }: { stage: LeadStage; leads: Lead[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage })
  const t = useT()
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex min-h-[60vh] w-full flex-col rounded-2xl border border-border bg-secondary/40 p-3 transition-colors',
        isOver && 'bg-brand/5 ring-2 ring-brand/30',
      )}
    >
      <div className="mb-3 flex items-center gap-2 px-1">
        <span className={cn('size-2.5 rounded-full', STAGE_ACCENT[stage])} />
        <h2 className="font-sans text-sm font-semibold text-foreground">{t(`agent.stage.${stage}`)}</h2>
        <span className="ml-auto rounded-full bg-background px-2 py-0.5 font-sans text-[0.6875rem] font-medium text-muted-foreground">
          {leads.length}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2.5">
        {leads.map((l) => (
          <LeadCard key={l.id} lead={l} />
        ))}
      </div>
    </div>
  )
}

export default function LeadsKanbanPage() {
  const t = useT()
  const toast = useToast()
  const [state, setState] = useState<ViewState>('loading')
  const [leads, setLeads] = useState<Lead[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  )

  const load = () => {
    setState('loading')
    leadService
      .getLeads()
      .then((d) => {
        setLeads(d)
        setState('success')
      })
      .catch(() => setState('error'))
  }
  useEffect(load, [])

  const onDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id))
  const onDragEnd = async (e: DragEndEvent) => {
    setActiveId(null)
    const id = String(e.active.id)
    const overId = e.over?.id ? String(e.over.id) : null
    if (!overId || !STAGES.includes(overId as LeadStage)) return
    const stage = overId as LeadStage
    const lead = leads.find((l) => l.id === id)
    if (!lead || lead.stage === stage) return

    const prev = leads
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, stage } : l)))
    const ok = await leadService.updateLeadStage(id, stage)
    if (!ok) {
      setLeads(prev)
      toast({ message: t('toast.error'), variant: 'error' })
    } else {
      toast({ message: t('toast.moved') })
    }
  }

  const activeLead = leads.find((l) => l.id === activeId) ?? null

  return (
    <div>
      <h1 className="font-sans text-2xl font-bold tracking-[-0.02em] text-foreground">{t('agent.leadsTitle')}</h1>
      <p className="mt-1 font-sans text-sm text-muted-foreground">{t('agent.leadsHint')}</p>

      <StateWrapper state={state} className="mt-6" onRetry={load}>
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {STAGES.map((s) => (
              <Column key={s} stage={s} leads={leads.filter((l) => l.stage === s)} />
            ))}
          </div>
          <DragOverlay>{activeLead ? <LeadCard lead={activeLead} overlay /> : null}</DragOverlay>
        </DndContext>
      </StateWrapper>
    </div>
  )
}
