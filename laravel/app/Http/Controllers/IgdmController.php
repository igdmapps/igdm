<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class IgdmController extends Controller
{
    private const API_BASE_URL = 'http://localhost:4000';

    public function showLoginForm()
    {
        return view('igdm.login');
    }

    public function login(Request $request)
    {
        $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        $response = Http::post(self::API_BASE_URL . '/login', [
            'username' => $request->input('username'),
            'password' => $request->input('password'),
        ]);

        if ($response->successful()) {
            return redirect('/igdm/chats');
        }

        return back()->withErrors(['login' => $response->json('error') ?? 'Login failed']);
    }

    public function chatList()
    {
        $response = Http::get(self::API_BASE_URL . '/chat-list');

        if (!$response->successful()) {
            abort(500, 'Unable to fetch chats.');
        }

        return view('igdm.chats', ['chats' => $response->json()]);
    }
}
