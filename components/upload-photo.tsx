import { useState } from "react";
import { createClient } from '@/lib/supabase/client'
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { DateLib } from "react-day-picker";

export default function UploadPhoto() {

  const [file, setFile] = useState<File | null>(null);
  const supabase = createClient()
  const [note, setNote] = useState("");
  const [photoDate, setPhotoDate] = useState<string>(); // YYYY-MM-DD


  const upload = async () => {

    if (!file) return;

    if (!photoDate) {
        alert("Огноо оруулна уу");
        return;
      }
    const fileName = Date.now()+".jpg";

    const { error } = await supabase.storage
      .from("baby-photos")
      .upload(fileName, file);

    if (error) {
      console.error(error);
      return;
    }

    await supabase.from("baby_photos").insert({
      photo_date: photoDate, // энд user-с авсан date
      file_name: fileName,
      note
    });

    alert("Uploaded!");
  };

  return (
    <Card>

    <CardContent>
        <div className="flex gap-4 p-4">

        <Input
        type="text"
        placeholder="note"
        value={note}
        onChange={(e)=>setNote(e.target.value)}
        className="border"
      />
      <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          data-empty={!photoDate}
          className="w-[280px] justify-start text-left font-normal data-[empty=true]:text-muted-foreground"
        >
          <CalendarIcon />
          {photoDate ? format(photoDate, "PPP") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        
        <Input
            type="date"
            value={photoDate}
            onChange={(e) => setPhotoDate(e.target.value)}
            className="border p-2"
        />
      </PopoverContent>
    </Popover>

      <Input
        type="file"
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          if (e.target.files) setFile(e.target.files[0]);
        }}
      />
        </div>
    </CardContent>
      <Button onClick={upload}>Upload</Button>
    </Card>
  );
}