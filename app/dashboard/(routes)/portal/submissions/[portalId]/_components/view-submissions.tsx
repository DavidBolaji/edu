"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"


import { ChevronLeft } from "lucide-react"
import { Submission } from "../../../types"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card"
import { Input } from "@/app/_components/ui/input"
import { Button } from "@/app/_components/ui/button"
import { SubmissionTable } from "./table/submission-table"
import { createColumns } from "./table/submissions-columns"

export default function ViewSubmissions({submissions, portal}: {submissions: Submission[], portal: {course: string, type: 'AUDIO' | 'EBOOK' | 'VIDEO'}}) {
  const params = useParams<{ portalId: string }>()
  const router = useRouter()
  const portalId = params?.portalId

  const [subs, setSubs] = useState<Submission[]>([])
  const [q, setQ] = useState("")

  const columns = useMemo(() => createColumns(portal?.type), [portal?.type])

  useEffect(() => {
    if (!portalId) return
    setSubs(submissions)
  }, [portalId])



  if (!portalId) return null

  return (
    <main className="mx-auto max-w-6xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 -ml-2.5">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </div>
       
      </div>
        <h1 className="text-xl font-semibold">Submissions</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              {"Portal"} — {portal?.course}
              {portal?.type && (
                <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  {portal.type.toLowerCase()} submissions
                </span>
              )}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Search by filename, type, or student..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <div className="rounded-md border">
           <SubmissionTable data={submissions} columns={columns} portalType={portal?.type} />
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
