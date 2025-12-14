"use server"

import db from "@/prisma";
import { Submission } from "../types";


export const getPortalSubmissions = async (id: string) => {
    const submissions = await db.submission.findMany({
        where: {
            portalId: id
        },
        include: {
            user: {
                select: {
                    fname: true,
                    lname: true
                }
            }

        },
        orderBy: {
            createdAt: 'desc',
        },
    });
    const portal = await db.portal.findUnique({
        where: {
            id
        },
        select: {
            course: true,
            type: true
        }
    })

    return {submissions, portal} as unknown as {submissions: Submission[], portal: {course: string, type: 'AUDIO' | 'EBOOK' | 'VIDEO'}};
};
