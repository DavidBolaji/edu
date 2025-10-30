"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
// import { listPortals, formatDate, hasSubmitted } from "@/lib/db"
import { UploadDialog } from "./upload-dialog"
import { CircleAlert, UserCircle, ChevronLeft } from "lucide-react"
import { Input } from "@/app/_components/ui/input"
import { Separator } from "@radix-ui/react-select"
import { Badge } from "@/app/_components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card"
import { Portal } from "../../_components/table/schema"
import { Button } from "@/app/_components/ui/button"
import { formatDateToCustomString, hasSubmitted } from "@/app/_lib/utils"


const STUDENT_ID = "student-1" // demo: pretend logged-in student

function statusFor(portal: Portal) {
  const now = new Date()
  const start = new Date(portal.openDate)
  const end = new Date(portal.closeDate)
  if (now < start) return { label: "Not open yet", variant: "secondary" as const }
  if (now > end) return { label: "Closed", variant: "destructive" as const }
  return { label: "Open", variant: "default" as const }
}

export default function ViewUserPortal({portal, studentId}: {portal: Portal[], studentId: string}) {
  const [portals, setPortals] = useState<Portal[]>(portal || [])
  const [query, setQuery] = useState("")

  useEffect(() => {
    setPortals(portal)
  }, [])

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return portals
    return portals.filter(
      (p) =>
        p.desc.toLowerCase().includes(q) ||
        p.course.toLowerCase().includes(q) ||
        p.type.toLowerCase().includes(q),
    )
  }, [portals, query])

  return (
    <main className="mx-auto max-w-5xl p-6 space-y-6">

      <Card>
       
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center gap-3">
            <Input
              placeholder="Search portal, course, or media type..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-2">
            {filtered.length === 0 ? (
              <div className="col-span-2 flex items-center gap-2 text-muted-foreground">
                <CircleAlert className="h-4 w-4" />
                <span>No portals found.</span>
              </div>
            ) : null}

            {filtered.map((portal) => {
              const st = statusFor(portal)
              const submitted = hasSubmitted(portal.submissions, studentId)
              return (
                <div key={portal.id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold">{portal.desc}</div>
                      <div className="text-sm text-muted-foreground">{portal.course}</div>
                    </div>
                    <Badge variant={st.variant}>{st.label}</Badge>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <div className="text-muted-foreground">Requested</div>
                      <div className="font-medium capitalize">{portal.type}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Window</div>
                      <div className="font-medium">
                        {formatDateToCustomString(portal.openDate as unknown as string)} - {formatDateToCustomString(portal.closeDate as unknown as string)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-2">
                    <div className="text-xs text-muted-foreground">
                      {submitted ? "Submission received" : "No submission yet"}
                    </div>
                    <UploadDialog portal={portal} studentId={studentId} />
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
