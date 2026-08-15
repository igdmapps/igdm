<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>IGdm Laravel Chats</title>
</head>
<body>
    <h1>IGdm Chat Threads</h1>
    @if (count($chats) === 0)
        <p>No chat threads found.</p>
    @else
        <ul>
            @foreach ($chats as $chat)
                <li>{{ $chat['thread_title'] ?? implode(', ', array_column($chat['users'], 'username')) }}</li>
            @endforeach
        </ul>
    @endif
</body>
</html>
