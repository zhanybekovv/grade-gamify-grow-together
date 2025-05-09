
import React from "react";
import { Link } from "react-router-dom";
import { Book } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Subject {
  id: string;
  name: string;
  description: string;
}

interface RecentActivityProps {
  enrolledSubjects: Subject[];
  pendingSubjects: Subject[];
  loading: boolean;
}

const RecentActivity = ({ 
  enrolledSubjects,
  pendingSubjects,
  loading
}: RecentActivityProps) => {
  return (
    <Card className="md:col-span-1">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-[200px]">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-edu-primary"></div>
          </div>
        ) : enrolledSubjects.length > 0 || pendingSubjects.length > 0 ? (
          <div className="space-y-4">
            {pendingSubjects.length > 0 && (
              <div>
                <h3 className="mb-2 font-medium text-sm text-muted-foreground">
                  Pending Requests
                </h3>
                <ul className="space-y-2">
                  {pendingSubjects.slice(0, 3).map((subject) => (
                    <li key={subject.id} className="flex items-center gap-2">
                      <Badge className="bg-yellow-100 text-yellow-800">
                        Pending
                      </Badge>
                      <span className="truncate">{subject.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {enrolledSubjects.length > 0 && (
              <div>
                <h3 className="mb-2 font-medium text-sm text-muted-foreground">
                  Recent Enrollments
                </h3>
                <ul className="space-y-2">
                  {enrolledSubjects.slice(0, 3).map((subject) => (
                    <li
                      key={subject.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <Book size={16} className="mr-2 text-edu-primary" />
                        <span className="truncate">{subject.name}</span>
                      </div>
                      <Link to={`/subjects/${subject.id}`}>
                        <Button size="sm" variant="ghost">
                          View
                        </Button>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              You haven't enrolled in any subjects yet
            </p>
            <Link to="/subjects">
              <Button>Browse Subjects</Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentActivity;
