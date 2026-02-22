-- AlterTable
ALTER TABLE "SOPTask" ADD COLUMN     "volunteerAssigneeId" TEXT;

-- AddForeignKey
ALTER TABLE "SOPTask" ADD CONSTRAINT "SOPTask_volunteerAssigneeId_fkey" FOREIGN KEY ("volunteerAssigneeId") REFERENCES "Volunteer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
