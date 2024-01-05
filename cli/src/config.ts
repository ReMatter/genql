import { GraphQLField, GraphQLInterfaceType, GraphQLObjectType } from 'graphql'

export const RUNTIME_LIB_NAME = './runtime'

export interface Config {
  verbose?: boolean
  endpoint?: string
  useGet?: boolean
  schema?: string
  output?: string
  headers?: Record<string, string>
  scalarTypes?: { [k: string]: string }
  fetchImport?: string
  sortProperties?: boolean
  isRequiredField?: (meta: {
    field: GraphQLField<any, any>
    type: GraphQLObjectType | GraphQLInterfaceType
  }) => boolean
}
