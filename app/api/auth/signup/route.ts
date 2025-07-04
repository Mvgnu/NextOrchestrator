import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { query } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Missing email or password' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const { rows: existingUsers } = await query(
      'SELECT email FROM users WHERE email = $1',
      [email]
    );

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { message: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)
    
    // Insert user into the database
    const { rows: newUsers } = await query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, email, name',
      [name || null, email, hashedPassword]
    );

    if (newUsers.length === 0) {
      console.error('Error creating user: Insert operation returned no rows');
      return NextResponse.json(
        { message: 'Error creating user during insert' },
        { status: 500 }
      );
    }
    
    const newUser = newUsers[0];

    // Return a success response with some user info (excluding password_hash)
    return NextResponse.json({ 
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name
      }
    });

  } catch (error: any) {
    console.error('Registration error:', error)
    if (error.code === '23505') {
        return NextResponse.json(
            { message: 'User with this email already exists.' },
            { status: 409 }
        );
    }
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
} 