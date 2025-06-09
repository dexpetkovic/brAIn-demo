import { EntitySchema } from 'typeorm'
import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type'

export const repositoryFactoryToken = (entity: EntityClassOrSchema): string => {
  if (entity instanceof EntitySchema) {
    return `transactional_repo_factory-${entity.options.name}`
  }
  return `transactional_repo_factory-${entity.name}`
}
