import { Injectable } from '@nestjs/common';
import { createId } from '@paralleldrive/cuid2';
import { compare, hash } from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
const PASSWORD_SALT = 10;

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) { }

  public readonly checkIfUserExists = async ({
    email,
    password,
    withPassword,
  }: {
    email: string;
    withPassword: boolean;
    password: string;
  }) => {
    // Renvoie true si l'utilisateur n'existe pas
    // Renvoie false si l'utilisateur existe
    // 1. Vérifier que l'utilisateur existe sur l'email
    // 2. Si withPassword est activé, on vérifie que son mot de passe
    // est bien défini.
    const existingUser = await this.prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
      },
    });
    if (!existingUser) {
      return {
        message: "L'email est invalide",
        error: true,
      };
    }

    if (withPassword) {
      // Rajouter une logique de validation par mot de passez
      const isPasswordValid = await compare(password, existingUser.password);

      if (!isPasswordValid) {
        return {
          message: "Le mot de passe est invalide",
          error: true,
        };
      }
    }
    return {
      message: "Cet email est déjà utilisé.",
      error: false,
    };
  };

  public readonly createUser = async ({
    email,
    name,
    password,
  }: {
    email: string;
    name: string;
    password: string;
  }) => {
    const hashedPassword = await hash(password, PASSWORD_SALT);
    return await this.prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });
  };

  public readonly authenticateUser = async ({
    email,
  }: {
    email: string;
  }) => {
    return await this.prisma.session.create({
      data: {
        user: {
          connect: {
            email
          },
        },
        sessionToken: createId()
      },
      select: {
        sessionToken: true
      }
    })
  };
}
