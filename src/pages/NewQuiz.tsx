
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/context/AuthContext";
import { Plus, Trash, Edit } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface QuizFormValues {
  title: string;
  description: string;
}

interface Question {
  id?: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
  points: number;
}

interface Subject {
  id: string;
  name: string;
  teacher_id: string;
}

const NewQuiz = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [subject, setSubject] = useState<Subject | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const form = useForm<QuizFormValues>({
    defaultValues: {
      title: "",
      description: "",
    },
  });

  const questionForm = useForm<Question>({
    defaultValues: {
      text: "",
      options: ["", "", "", ""],
      correctOptionIndex: 0,
      points: 10,
    },
  });

  useEffect(() => {
    const fetchSubject = async () => {
      try {
        if (!subjectId) return;

        const { data, error } = await supabase
          .from("subjects")
          .select("id, name, teacher_id")
          .eq("id", subjectId)
          .single();

        if (error) {
          throw error;
        }

        setSubject(data);

        // Verify the current user is the teacher of this subject
        if (currentUser?.id && data.teacher_id !== currentUser.id) {
          toast.error("You don't have permission to create a quiz for this subject");
          navigate(-1);
        }
      } catch (error) {
        console.error("Error fetching subject:", error);
        toast.error("Failed to load subject details");
        navigate("/subjects");
      } finally {
        setLoading(false);
      }
    };

    fetchSubject();
  }, [subjectId, currentUser?.id, navigate]);

  const openQuestionDialog = (question?: Question, index?: number) => {
    if (question) {
      questionForm.reset(question);
      setEditingQuestionIndex(index || null);
    } else {
      questionForm.reset({
        text: "",
        options: ["", "", "", ""],
        correctOptionIndex: 0,
        points: 10,
      });
      setEditingQuestionIndex(null);
    }
    setQuestionDialogOpen(true);
  };

  const handleAddQuestion = (data: Question) => {
    if (editingQuestionIndex !== null) {
      // Edit existing question
      const updatedQuestions = [...questions];
      updatedQuestions[editingQuestionIndex] = data;
      setQuestions(updatedQuestions);
    } else {
      // Add new question
      setQuestions([...questions, data]);
    }
    setQuestionDialogOpen(false);
  };

  const handleRemoveQuestion = (index: number) => {
    const updatedQuestions = [...questions];
    updatedQuestions.splice(index, 1);
    setQuestions(updatedQuestions);
  };

  const onSubmit = async (data: QuizFormValues) => {
    try {
      if (!currentUser || !subjectId) {
        toast.error("Missing required information");
        return;
      }

      if (questions.length === 0) {
        toast.error("Please add at least one question to your quiz");
        return;
      }

      // Insert quiz
      const { data: quizData, error: quizError } = await supabase
        .from("quizzes")
        .insert({
          title: data.title,
          description: data.description,
          subject_id: subjectId,
        })
        .select()
        .single();

      if (quizError) {
        throw quizError;
      }

      // Insert questions
      const questionsToInsert = questions.map(q => ({
        text: q.text,
        options: q.options,
        correct_option_index: q.correctOptionIndex,
        points: q.points,
        quiz_id: quizData.id,
      }));

      const { error: questionsError } = await supabase
        .from("questions")
        .insert(questionsToInsert);

      if (questionsError) {
        throw questionsError;
      }

      toast.success("Quiz created successfully!");
      navigate(`/subjects/${subjectId}`);
    } catch (error) {
      console.error("Error creating quiz:", error);
      toast.error("Failed to create quiz");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="container mx-auto px-4 py-6">
          <div className="flex justify-center items-center h-64">
            <p>Loading...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Create New Quiz</h1>
          <p className="text-muted-foreground">
            {subject && `Adding quiz to ${subject.name}`}
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Quiz Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quiz Title</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g. Midterm Exam" 
                            {...field} 
                            required 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe what this quiz covers..."
                            className="min-h-[100px]"
                            {...field} 
                            required
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Questions</CardTitle>
              <Button onClick={() => openQuestionDialog()} variant="outline">
                <Plus size={16} className="mr-2" /> Add Question
              </Button>
            </CardHeader>
            <CardContent>
              {questions.length === 0 ? (
                <div className="text-center py-8 border border-dashed rounded-md bg-muted/30">
                  <p>No questions added yet</p>
                  <Button
                    variant="outline"
                    className="mt-2"
                    onClick={() => openQuestionDialog()}
                  >
                    <Plus size={16} className="mr-2" /> Add Your First Question
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {questions.map((question, index) => (
                    <div
                      key={index}
                      className="p-4 border rounded-md flex items-start justify-between"
                    >
                      <div>
                        <h3 className="font-medium">
                          Question {index + 1}: {question.text}
                        </h3>
                        <div className="mt-2 text-sm text-muted-foreground">
                          <p>Options: {question.options.join(", ")}</p>
                          <p>Correct answer: {question.options[question.correctOptionIndex]}</p>
                          <p>Points: {question.points}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openQuestionDialog(question, index)}
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleRemoveQuestion(index)}
                        >
                          <Trash size={16} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
            <Button
              onClick={form.handleSubmit(onSubmit)}
              disabled={questions.length === 0}
            >
              Create Quiz
            </Button>
          </div>
        </div>

        <Dialog open={questionDialogOpen} onOpenChange={setQuestionDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingQuestionIndex !== null ? "Edit Question" : "Add Question"}
              </DialogTitle>
            </DialogHeader>
            
            <Form {...questionForm}>
              <form onSubmit={questionForm.handleSubmit(handleAddQuestion)} className="space-y-4">
                <FormField
                  control={questionForm.control}
                  name="text"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Question Text</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g. What is the capital of France?" 
                          {...field} 
                          required 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div>
                  <FormLabel>Answer Options</FormLabel>
                  <div className="space-y-2 mt-2">
                    {[0, 1, 2, 3].map((optionIndex) => (
                      <div key={optionIndex} className="flex gap-2 items-center">
                        <Input
                          placeholder={`Option ${optionIndex + 1}`}
                          value={questionForm.watch(`options.${optionIndex}`) || ""}
                          onChange={(e) => {
                            const newOptions = [...questionForm.watch("options")];
                            newOptions[optionIndex] = e.target.value;
                            questionForm.setValue("options", newOptions);
                          }}
                          required
                        />
                        <RadioGroup
                          value={String(questionForm.watch("correctOptionIndex"))}
                          onValueChange={(value) => {
                            questionForm.setValue("correctOptionIndex", parseInt(value));
                          }}
                          className="flex"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem
                              value={String(optionIndex)}
                              id={`option-${optionIndex}`}
                            />
                            <Label htmlFor={`option-${optionIndex}`}>Correct</Label>
                          </div>
                        </RadioGroup>
                      </div>
                    ))}
                  </div>
                </div>

                <FormField
                  control={questionForm.control}
                  name="points"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Points</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={1}
                          {...field} 
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          required 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setQuestionDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingQuestionIndex !== null ? "Update" : "Add"} Question
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default NewQuiz;
