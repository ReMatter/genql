import {
  getNamedType,
  GraphQLArgument,
  GraphQLField,
  GraphQLInputObjectType,
  GraphQLInterfaceType,
  GraphQLObjectType,
  isInterfaceType,
} from 'graphql'
import { ArgMap, Field, FieldMap } from '../../runtime/types'
import { RenderContext } from '../common/RenderContext'
import { isEmpty } from './support'

export const objectType = (
  type: GraphQLObjectType | GraphQLInterfaceType | GraphQLInputObjectType,
  ctx: RenderContext,
) => {
  const typeObj: FieldMap<string> = Object.keys(type.getFields()).reduce<
    FieldMap<string>
  >((r, f) => {
    const field = type.getFields()[f]
    const namedType = getNamedType(field.type)
    const fieldObj: Field<string> = { type: namedType.name }
    r[f] = fieldObj

    const args: readonly GraphQLArgument[] =
      (field as GraphQLField<any, any>).args || []

    if (args.length > 0) {
      fieldObj.args = args.reduce<ArgMap<string>>((r, a) => {
        const concreteType = a.type.toString()
        const typename = getNamedType(a.type).name
        r[a.name] = [typename]
        if (typename !== concreteType) {
          r[a.name]?.push(concreteType)
        }
        return r
      }, {})
    }

    return r
  }, {})

  if (isInterfaceType(type) && ctx.schema) {
    ctx.schema.getPossibleTypes(type).map((t) => {
      if (!isEmpty(typeObj)) {
        typeObj[`on_${t.name}`] = { type: t.name }
      }
    })
  }

  if (!isEmpty(typeObj)) {
    typeObj.__typename = { type: 'String' }
  }

  // const scalar = Object.keys(type.getFields())
  //   .map(f => type.getFields()[f])
  //   .filter(f => isScalarType(getNamedType(f.type)) || isEnumType(getNamedType(f.type)))
  //   .map(f => f.name)

  // if (scalar.length > 0) typeObj.scalar = scalar

  return typeObj
}
