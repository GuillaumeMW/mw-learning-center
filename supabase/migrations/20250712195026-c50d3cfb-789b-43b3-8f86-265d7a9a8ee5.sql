-- Add sample video URL to the first lesson
UPDATE lessons 
SET video_url = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
WHERE title = 'Introduction to Relocation Services';