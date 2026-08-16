<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\IgdmController;

const API_BASE_URL = 'http://localhost:4000';

Route::get('/igdm/login', [IgdmController::class, 'showLoginForm']);
Route::post('/igdm/login', [IgdmController::class, 'login']);
Route::get('/igdm/chats', [IgdmController::class, 'chatList']);
