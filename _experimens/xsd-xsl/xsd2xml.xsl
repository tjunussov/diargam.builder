<?xml version='1.0'?>
    <xsl:stylesheet
      version='1.0'
      xmlns:xsl='http://www.w3.org/1999/XSL/Transform'>

      <xsl:output
        method='xml'
        indent='yes'/>

      <xsl:template match='/schema'>
        <xsl:apply-templates select='element[1]'/>
      </xsl:template>

      <xsl:template match='element[@name and archtype]'>
        <xsl:element name='{@name}'>
          <xsl:apply-templates select='archtype'/>
        </xsl:element>
      </xsl:template>

      <xsl:template match='element[@name and @type]'>
        <xsl:element name='{@name}'>
          <xsl:choose>
            <xsl:when test='@type="integer"'>
              <xsl:text>123</xsl:text>
            </xsl:when>
            <xsl:otherwise>
              <xsl:value-of select='@type'/>
              <xsl:text> [unknown type]</xsl:text>
            </xsl:otherwise>
          </xsl:choose>
        </xsl:element>
      </xsl:template>

      <xsl:template match='archtype[@content="mixed"]'>
        <xsl:value-of select='../@name'/>
        <xsl:for-each select='*'>
          <xsl:text> and </xsl:text>
          <xsl:apply-templates select='.'/>
        </xsl:for-each>
      </xsl:template>

      <xsl:template match='archtype'>
        <xsl:apply-templates select='*'/>
      </xsl:template>

      <xsl:template match='element[@ref]'>
        <xsl:apply-templates
          select='../element[@name=current()/@ref]
                  | /schema/element
                    [@name=current()/@ref]'/>
      </xsl:template>
    </xsl:stylesheet>